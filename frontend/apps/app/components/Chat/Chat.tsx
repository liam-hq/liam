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

  // Job completion handlers (memoized to prevent infinite loops)
  const handleJobComplete = useCallback(
    async (result: TriggerJobResult) => {
      setProgressMessages(() => [])

      if (currentAiMessage && result.success && result.generatedAnswer) {
        // Update the AI message with the generated answer
        const updatedMessage = {
          ...currentAiMessage,
          content: result.generatedAnswer,
          timestamp: new Date(),
          isGenerating: false,
        }

        // Save to database
        const saveResult = await saveMessage({
          designSessionId: designSession.id,
          content: result.generatedAnswer,
          role: 'assistant',
          userId: null,
        })

        if (saveResult.success && saveResult.message) {
          updatedMessage.dbId = saveResult.message.id
        }

        addOrUpdateMessage(updatedMessage)
        setCurrentAiMessage(undefined)
        setTriggerJobId(undefined)
        setIsLoading(false)

        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 10)
      }
    },
    [currentAiMessage, designSession.id, addOrUpdateMessage],
  )

  const handleJobError = useCallback(async (_error: string) => {
    // For now, just log the error and let the system continue
    // The streamingWorkflow already has fallback polling built-in
    // Don't update UI or clear states - let the fallback polling handle completion
    // The job will complete via file-based polling in the background
  }, [])

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
