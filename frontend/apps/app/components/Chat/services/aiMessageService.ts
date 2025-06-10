'use client'

import type { Schema, TableGroup } from '@liam-hq/db-structure'
import type { Mode } from '../../ChatInput/components/ModeToggleSwitch/ModeToggleSwitch'
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
  mode: Mode
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
  mode: Mode,
  addOrUpdateMessage: (message: ChatEntry, userId?: string | null) => void,
): ChatEntry => {
  const aiMessageId = generateMessageId('ai')
  const aiMessage: ChatEntry = {
    id: aiMessageId,
    content: '',
    isUser: false,
    // No timestamp during streaming
    isGenerating: true, // Mark as generating
    agentType: mode, // Store the current mode with the message
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
  mode: Mode,
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
      mode,
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
    } else if (parsed.type === 'heartbeat') {
      // Handle heartbeat messages to maintain connection
      // TODO: Remove this heartbeat handling once ProcessIndicator provides a better solution
      // Update progress messages with heartbeat content
      setProgressMessages((prev) => {
        const filtered = prev.filter(
          (msg) => !msg.includes('Processing...'),
        )
        return [...filtered, parsed.content]
      })
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
 * Handles errors and updates AI message with error content
 */
const handleStreamingError = (
  error: unknown,
  messages: ChatEntry[],
  mode: Mode,
  addOrUpdateMessage: (message: ChatEntry, userId?: string | null) => void,
  setProgressMessages: (updater: (prev: string[]) => string[]) => void,
): CreateAIMessageResult => {
  console.error('Error in createAndStreamAIMessage:', error)

  // Clear progress messages and streaming state on error
  setProgressMessages(() => [])

  // Update error in the AI message or add a new error message
  // Check if we already added an AI message that we can update
  const existingAiMessage = messages.find((msg) => msg.id.startsWith('ai-'))

  if (existingAiMessage && existingAiMessage.content === '') {
    // Update the existing empty message with error, add timestamp, and remove generating state
    const errorAiMessage = createChatEntry(existingAiMessage, {
      content: ERROR_MESSAGES.GENERAL,
      timestamp: new Date(),
      isGenerating: false, // Remove generating state on error
      agentType: mode, // Ensure the agent type is set for error messages
    })
    addOrUpdateMessage(errorAiMessage)
  } else {
    // Create a new error message with timestamp
    const errorMessage: ChatEntry = {
      id: generateMessageId('error'),
      content: ERROR_MESSAGES.GENERAL,
      isUser: false,
      timestamp: new Date(),
      isGenerating: false, // Ensure error message is not in generating state
      agentType: mode, // Use the current mode for error messages
    }
    addOrUpdateMessage(errorMessage)
  }

  return {
    success: false,
    error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL,
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
  mode,
  designSession,
  addOrUpdateMessage,
  setProgressMessages,
}: CreateAIMessageParams): Promise<CreateAIMessageResult> => {
  try {
    // Create AI message placeholder for streaming (without timestamp)
    const aiMessage = createAIMessagePlaceholder(mode, addOrUpdateMessage)

    // Format chat history for API
    const history = formatChatHistory(messages)

    // Call API with streaming response
    const response = await callChatAPI(
      message,
      schemaData,
      tableGroups,
      history,
      mode,
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
    return handleStreamingError(
      error,
      messages,
      mode,
      addOrUpdateMessage,
      setProgressMessages,
    )
  }
}
