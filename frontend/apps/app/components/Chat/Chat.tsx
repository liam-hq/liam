'use client'

import type { Schema, TableGroup } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatInput } from '../ChatInput'
import { ChatMessage } from '../ChatMessage'
import styles from './Chat.module.css'
import type { TriggerJobResult } from './hooks/types'
import { type Message, useRealtimeMessages } from './hooks/useRealtimeMessages'
import { useTriggerJobMonitorWithAuth } from './hooks/useTriggerJobMonitorWithAuth'
import { getCurrentUserId, saveMessage } from './services'
import { createAndStreamAIMessage } from './services/aiMessageService'
import { generateMessageId } from './services/messageHelpers'
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
  const [progressMessages, setProgressMessages] = useState<string[]>([])
  const [triggerJobId, setTriggerJobId] = useState<string | undefined>()
  const [currentAiMessage, setCurrentAiMessage] = useState<
    ChatEntry | undefined
  >()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const autoStartExecuted = useRef(false)

  // Get current user ID on component mount
  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await getCurrentUserId()
      setCurrentUserId(userId)
    }
    fetchUserId()
  }, [])

  // Helper function to simulate streaming display of text
  const streamText = useCallback(
    async (text: string, targetMessage: ChatEntry) => {
      const words = text.split(/(\s+)/) // Split by whitespace but keep the whitespace
      let accumulatedText = ''

      for (let i = 0; i < words.length; i++) {
        accumulatedText += words[i]

        // Update the message with accumulated text
        const streamingMessage = {
          ...targetMessage,
          content: accumulatedText,
          isGenerating: true,
        }
        addOrUpdateMessage(streamingMessage)

        // Add delay between words for streaming effect
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      // Final update with complete text and remove generating state
      const finalMessage = {
        ...targetMessage,
        content: text,
        timestamp: new Date(),
        isGenerating: false,
      }

      // Save to database
      const saveResult = await saveMessage({
        designSessionId: designSession.id,
        content: text,
        role: 'assistant',
        userId: null,
      })

      if (saveResult.success && saveResult.message) {
        finalMessage.dbId = saveResult.message.id
      }

      addOrUpdateMessage(finalMessage)
    },
    [addOrUpdateMessage, designSession.id],
  )

  // Job completion handlers (memoized to prevent infinite loops)
  const handleJobComplete = useCallback(
    async (result: TriggerJobResult) => {
      // Prevent duplicate processing - check if this job was already processed
      if (!currentAiMessage || !triggerJobId) {
        return
      }

      setProgressMessages(() => [])

      if (result.success && result.generatedAnswer) {
        // Stream the generated answer
        await streamText(result.generatedAnswer, currentAiMessage)

        // Clear states after successful processing
        setCurrentAiMessage(undefined)
        setTriggerJobId(undefined)
        setIsLoading(false)

        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 10)
      } else {
        // Handle failed job result
        const errorText =
          'Sorry, I encountered an error while generating your answer. Please try again.'
        await streamText(errorText, currentAiMessage)

        // Clear states after error handling
        setCurrentAiMessage(undefined)
        setTriggerJobId(undefined)
        setIsLoading(false)

        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 10)
      }
    },
    [currentAiMessage, triggerJobId, streamText],
  )

  const handleJobError = useCallback(
    async (_error: string) => {
      // Clear progress messages
      setProgressMessages(() => [])

      if (currentAiMessage) {
        // Update the AI message with an error message
        const errorMessage = {
          ...currentAiMessage,
          content:
            'Sorry, I encountered an error while processing your request. Please try again.',
          timestamp: new Date(),
          isGenerating: false,
        }

        // Save error message to database
        const saveResult = await saveMessage({
          designSessionId: designSession.id,
          content: errorMessage.content,
          role: 'assistant',
          userId: null,
        })

        if (saveResult.success && saveResult.message) {
          errorMessage.dbId = saveResult.message.id
        }

        addOrUpdateMessage(errorMessage)
      }

      // Clear states after error handling
      setCurrentAiMessage(undefined)
      setTriggerJobId(undefined)
      setIsLoading(false)

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 10)
    },
    [currentAiMessage, designSession.id, addOrUpdateMessage],
  )

  // Use Trigger.dev job monitoring with authentication
  const { isMonitoring: _isMonitoring, jobStatus: _jobStatus } =
    useTriggerJobMonitorWithAuth({
      triggerJobId,
      onJobComplete: handleJobComplete,
      onJobError: handleJobError,
    })
  // Auto-start AI response for initial user message
  useEffect(() => {
    if (!currentUserId || autoStartExecuted.current || isLoading) return

    // Only auto-start if there's exactly one message and it's from user
    if (
      designSession.messages.length === 1 &&
      designSession.messages[0].role === 'user'
    ) {
      const initialMessage = designSession.messages[0]
      autoStartExecuted.current = true
      startAIResponse(initialMessage.content)
    }
  }, [currentUserId, designSession.messages, isLoading])

  // Scroll to bottom when component mounts or messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Start AI response without saving user message (for auto-start scenarios)
  const startAIResponse = async (content: string) => {
    setIsLoading(true)

    // Create and stream AI message
    const result = await createAndStreamAIMessage({
      message: content,
      schemaData,
      tableGroups,
      messages,
      designSession,
      addOrUpdateMessage,
      setProgressMessages,
      onTriggerJobDetected: (triggerJobId, aiMessage) => {
        setTriggerJobId(triggerJobId)
        setCurrentAiMessage(aiMessage)
        // Keep loading state - will be cleared when job completes
      },
    })

    if (result.success) {
      // Scroll to bottom after successful completion
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 10)
    }

    setIsLoading(false)
  }

  // TODO: Add rate limiting - Implement rate limiting for message sending to prevent spam
  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatEntry = {
      id: generateMessageId('user'),
      content,
      isUser: true,
      timestamp: new Date(),
      isGenerating: false, // Explicitly set to false for consistency
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

    // Create and stream AI message
    const result = await createAndStreamAIMessage({
      message: content,
      schemaData,
      tableGroups,
      messages,
      designSession,
      addOrUpdateMessage,
      setProgressMessages,
      onTriggerJobDetected: (triggerJobId, aiMessage) => {
        setTriggerJobId(triggerJobId)
        setCurrentAiMessage(aiMessage)
        // Keep loading state - will be cleared when job completes
      },
    })

    if (result.success) {
      // Scroll to bottom after successful completion
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 10)
    }

    setIsLoading(false)
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
      />
    </div>
  )
}
