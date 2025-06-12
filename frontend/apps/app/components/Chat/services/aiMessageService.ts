'use client'

import type { Schema, TableGroup } from '@liam-hq/db-structure'
import { ERROR_MESSAGES } from '../constants/chatConstants'
import type { ChatEntry } from '../types/chatTypes'
import {
  createChatEntry,
  formatChatHistory,
  generateMessageId,
  isResponseChunk,
  updateProgressMessages,
} from './messageHelpers'
import { saveMessage } from './messageServiceClient'

type DesignSession = {
  id: string
  organizationId: string
  buildingSchemaId: string
  latestVersionNumber?: number
}

interface CreateAIMessageParams {
  message: string
  schemaData: Schema
  tableGroups?: Record<string, TableGroup>
  messages: ChatEntry[]
  designSession: DesignSession
  addOrUpdateMessage: (message: ChatEntry, userId?: string | null) => void
  setProgressMessages: (updater: (prev: string[]) => string[]) => void
}

interface CreateAIMessageResult {
  success: boolean
  finalMessage?: ChatEntry
  error?: string
}

/**
 * Creates an AI message placeholder for streaming
 */
const createAIMessagePlaceholder = (
  addOrUpdateMessage: (message: ChatEntry, userId?: string | null) => void,
): ChatEntry => {
  const aiMessageId = generateMessageId('ai')
  const aiMessage: ChatEntry = {
    id: aiMessageId,
    role: 'assistant',
    content: '',
    // No timestamp during streaming
    isGenerating: true, // Mark as generating
  }
  addOrUpdateMessage(aiMessage)
  return aiMessage
}

/**
 * Calls the /api/chat endpoint with the given parameters
 */
const callChatAPI = async (
  message: string,
  schemaData: Schema,
  tableGroups: Record<string, TableGroup> | undefined,
  history: [string, string][],
  designSession: DesignSession,
): Promise<Response> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      schemaData,
      tableGroups,
      history,
      organizationId: designSession.organizationId,
      buildingSchemaId: designSession.buildingSchemaId,
      latestVersionNumber: designSession.latestVersionNumber || 0,
    }),
  })

  if (!response.ok) {
    throw new Error(ERROR_MESSAGES.FETCH_FAILED)
  }

  return response
}

/**
 * Processes a single line from the streaming response
 */
const processStreamLine = (
  line: string,
  accumulatedContent: string,
  aiMessage: ChatEntry,
  addOrUpdateMessage: (message: ChatEntry, userId?: string | null) => void,
  setProgressMessages: (updater: (prev: string[]) => string[]) => void,
): string => {
  try {
    const parsed = JSON.parse(line)

    // Validate the parsed data has the expected structure
    if (!isResponseChunk(parsed)) {
      console.error('Invalid response format:', parsed)
      return accumulatedContent
    }

    if (parsed.type === 'text') {
      // Append text content to accumulated content
      const newAccumulatedContent = accumulatedContent + parsed.content

      // Update the AI message with the accumulated content (without timestamp)
      // Keep isGenerating: true during streaming
      const streamingAiMessage = createChatEntry(aiMessage, {
        content: newAccumulatedContent,
        isGenerating: true,
      })
      addOrUpdateMessage(streamingAiMessage)

      return newAccumulatedContent
    }
    if (parsed.type === 'custom') {
      // Update progress messages
      setProgressMessages((prev) =>
        updateProgressMessages(prev, parsed.content),
      )
    } else if (parsed.type === 'error') {
      // Handle error message
      console.error('Stream error:', parsed.content)
      setProgressMessages(() => [])
      throw new Error(parsed.content)
    }
  } catch {
    // If JSON parsing fails, treat as plain text (backward compatibility)
    const newAccumulatedContent = accumulatedContent + line
    const backwardCompatMessage = createChatEntry(aiMessage, {
      content: newAccumulatedContent,
      isGenerating: true,
    })
    addOrUpdateMessage(backwardCompatMessage)
    return newAccumulatedContent
  }

  return accumulatedContent
}

/**
 * Generates appropriate error message based on error type
 */
const getErrorDisplayMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to get response')) {
      return 'ネットワークエラーが発生しました。接続を確認して再試行してください。'
    }
    if (error.message.includes('Response body is not readable')) {
      return 'サーバーからの応答を読み取れませんでした。再試行してください。'
    }
    if (error.message.includes('API')) {
      return 'サーバーエラーが発生しました。しばらく時間を置いて再試行してください。'
    }
    return `エラーが発生しました: ${error.message}`
  }
  return ERROR_MESSAGES.GENERAL
}

/**
 * Handles errors and creates appropriate error message
 */
const handleStreamingError = async (
  error: unknown,
  designSession: DesignSession,
  messages: ChatEntry[],
  addOrUpdateMessage: (message: ChatEntry, userId?: string | null) => void,
  setProgressMessages: (updater: (prev: string[]) => string[]) => void,
): Promise<CreateAIMessageResult> => {
  console.error('Error in createAndStreamAIMessage:', error)

  // Clear progress messages and streaming state on error
  setProgressMessages(() => [])

  // Generate appropriate error message
  const errorContent = getErrorDisplayMessage(error)

  // Check if we have an existing AI message that we can replace with error
  const existingAiMessage = messages.find((msg) => 
    msg.id.startsWith('ai-') && msg.isGenerating && msg.content === ''
  )

  if (existingAiMessage) {
    // Replace the generating AI message with an error message
    const errorMessage = createChatEntry(existingAiMessage, {
      role: 'error',
      content: errorContent,
      timestamp: new Date(),
      isGenerating: false,
    })
    addOrUpdateMessage(errorMessage)

    // Save error message to database
    const saveResult = await saveMessage({
      designSessionId: designSession.id,
      content: errorContent,
      role: 'error',
      userId: null,
    })

    if (saveResult.success && saveResult.message) {
      const finalErrorMessage = createChatEntry(errorMessage, {
        dbId: saveResult.message.id,
      })
      addOrUpdateMessage(finalErrorMessage)
    }
  } else {
    // Create a new error message
    const errorMessage: ChatEntry = {
      id: generateMessageId('error'),
      role: 'error',
      content: errorContent,
      timestamp: new Date(),
      isGenerating: false,
    }
    addOrUpdateMessage(errorMessage)

    // Save error message to database
    const saveResult = await saveMessage({
      designSessionId: designSession.id,
      content: errorContent,
      role: 'error',
      userId: null,
    })

    if (saveResult.success && saveResult.message) {
      const finalErrorMessage = createChatEntry(errorMessage, {
        dbId: saveResult.message.id,
      })
      addOrUpdateMessage(finalErrorMessage)
    }
  }

  return {
    success: false,
    error: errorContent,
  }
}

/**
 * Creates an AI message by calling the /api/chat endpoint and processing the streaming response
 */
export const createAndStreamAIMessage = async ({
  message,
  schemaData,
  tableGroups,
  messages,
  designSession,
  addOrUpdateMessage,
  setProgressMessages,
}: CreateAIMessageParams): Promise<CreateAIMessageResult> => {
  try {
    // Create AI message placeholder for streaming (without timestamp)
    const aiMessage = createAIMessagePlaceholder(addOrUpdateMessage)

    // Format chat history for API
    const history = formatChatHistory(messages)

    // Call API with streaming response
    const response = await callChatAPI(
      message,
      schemaData,
      tableGroups,
      history,
      designSession,
    )

    // Process the streaming response
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error(ERROR_MESSAGES.RESPONSE_NOT_READABLE)
    }

    let accumulatedContent = ''
    let aiDbId: string | undefined

    // Read the stream
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // Streaming is complete, save to database and add timestamp
        const saveResult = await saveMessage({
          designSessionId: designSession.id,
          content: accumulatedContent,
          role: 'assistant',
          userId: null,
        })
        if (saveResult.success && saveResult.message) {
          aiDbId = saveResult.message.id
        }

        // Update message with final content, timestamp, and database ID
        const finalAiMessage = createChatEntry(aiMessage, {
          content: accumulatedContent,
          timestamp: new Date(),
          isGenerating: false, // Remove generating state when complete
          dbId: aiDbId,
        })
        addOrUpdateMessage(finalAiMessage)

        return { success: true, finalMessage: finalAiMessage }
      }

      // Decode the chunk and process JSON messages
      const chunk = new TextDecoder().decode(value)
      const lines = chunk.split('\n').filter((line) => line.trim())

      for (const line of lines) {
        accumulatedContent = processStreamLine(
          line,
          accumulatedContent,
          aiMessage,
          addOrUpdateMessage,
          setProgressMessages,
        )
      }

      // Note: Scroll handling should be done by the caller component
    }
  } catch (error) {
    return await handleStreamingError(
      error,
      designSession,
      messages,
      addOrUpdateMessage,
      setProgressMessages,
    )
  }
}
