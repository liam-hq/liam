'use client'

import type { Schema, TableGroup } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ChatInput } from '../ChatInput'
import type { Mode } from '../ChatInput/components/ModeToggleSwitch/ModeToggleSwitch'
import { ChatMessage } from '../ChatMessage'
import styles from './Chat.module.css'
import { ERROR_MESSAGES } from './constants/chatConstants'
import { type Message, useRealtimeMessages } from './hooks/useRealtimeMessages'
import { getCurrentUserId, saveMessage } from './services'
import {
  createChatEntry,
  formatChatHistory,
  generateMessageId,
  isResponseChunk,
  updateProgressMessages,
} from './services/messageHelpers'
import type { ChatEntry } from './types/chatTypes'

type DesignSession = {
  id: string
  organizationId: string
  messages: Message[]
  buildingSchemaId: string
  latestVersionNumber?: number
}

interface Props {
  schemaData: Schema
  tableGroups?: Record<string, TableGroup>
  designSession: DesignSession
}

export const Chat: FC<Props> = ({ schemaData, tableGroups, designSession }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { messages, addOrUpdateMessage } = useRealtimeMessages(
    designSession,
    currentUserId,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [currentMode, setCurrentMode] = useState<Mode>('ask')
  const [progressMessages, setProgressMessages] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get current user ID on component mount
  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await getCurrentUserId()
      setCurrentUserId(userId)
    }
    fetchUserId()
  }, [])

  // Scroll to bottom when component mounts or messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // TODO: Add rate limiting - Implement rate limiting for message sending to prevent spam
  // biome-ignore  lint/complexity/noExcessiveCognitiveComplexity: fix later
  const handleSendMessage = async (content: string, mode: Mode) => {
    // Update the current mode and agent type
    setCurrentMode(mode)

    // Add user message
    const userMessage: ChatEntry = {
      id: generateMessageId('user'),
      content,
      isUser: true,
      timestamp: new Date(),
      isGenerating: false, // Explicitly set to false for consistency
      agentType: mode, // Store the current mode with the user message as well
    }
    addOrUpdateMessage(userMessage)

    // Save user message to database
    const saveResult = await saveMessage({
      designSessionId: designSession.id,
      content,
      role: 'user',
      userId: currentUserId,
    })
    if (saveResult.success && saveResult.message) {
      // Update the message with the database ID
      const updatedUserMessage = {
        ...userMessage,
        dbId: saveResult.message?.id,
      }
      addOrUpdateMessage(updatedUserMessage, currentUserId)
    }

    setIsLoading(true)

    // Create AI message placeholder for streaming (without timestamp)
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

    try {
      // Format chat history for API
      const history = formatChatHistory(messages)

      // Call API with streaming response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
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
          break
        }

        // Decode the chunk and process JSON messages
        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter((line) => line.trim())

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line)

            // Validate the parsed data has the expected structure
            if (!isResponseChunk(parsed)) {
              console.error('Invalid response format:', parsed)
              continue
            }

            if (parsed.type === 'text') {
              // Append text content to accumulated content
              accumulatedContent += parsed.content

              // Update the AI message with the accumulated content (without timestamp)
              // Keep isGenerating: true during streaming
              const streamingAiMessage = createChatEntry(aiMessage, {
                content: accumulatedContent,
                isGenerating: true,
              })
              addOrUpdateMessage(streamingAiMessage)

              // Force immediate update for smoother streaming experience
              // Using a small timeout to allow React to batch updates
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
              }, 10)
            } else if (parsed.type === 'custom') {
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
              setProgressMessages([])
              throw new Error(parsed.content)
            }
          } catch {
            // If JSON parsing fails, treat as plain text (backward compatibility)
            accumulatedContent += chunk
            const backwardCompatMessage = createChatEntry(aiMessage, {
              content: accumulatedContent,
              isGenerating: true,
            })
            addOrUpdateMessage(backwardCompatMessage)
          }
        }

        // Scroll to bottom as content streams in
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Clear progress messages and streaming state on error
      setProgressMessages([])

      // Update error in the AI message or add a new error message
      // Check if we already added an AI message that we can update
      const existingAiMessage = messages.find((msg) => msg.id.startsWith('ai-'))

      if (existingAiMessage && existingAiMessage.content === '') {
        // Update the existing empty message with error, add timestamp, and remove generating state
        const errorAiMessage = createChatEntry(existingAiMessage, {
          content: ERROR_MESSAGES.GENERAL,
          timestamp: new Date(),
          isGenerating: false, // Remove generating state on error
          agentType: currentMode, // Ensure the agent type is set for error messages
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
          agentType: currentMode, // Use the current mode for error messages
        }
        addOrUpdateMessage(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.messagesContainer}>
        {/* Display all messages */}
        {messages.map((message, index) => {
          // Check if this is the last AI message and has progress messages
          const isLastAIMessage =
            !message.isUser && index === messages.length - 1
          const shouldShowProgress =
            progressMessages.length > 0 && isLastAIMessage

          return (
            <ChatMessage
              key={message.id}
              content={message.content}
              isUser={message.isUser}
              timestamp={message.timestamp}
              isGenerating={message.isGenerating}
              agentType={message.agentType || currentMode}
              progressMessages={
                shouldShowProgress ? progressMessages : undefined
              }
              showProgress={shouldShowProgress}
            />
          )
        })}
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        schema={schemaData}
        initialMode={currentMode}
      />
    </div>
  )
}
