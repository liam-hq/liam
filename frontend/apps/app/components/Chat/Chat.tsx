'use client'

import type { Schema, TableGroup } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ChatInput } from '../ChatInput'
import { ChatMessage } from '../ChatMessage'
import styles from './Chat.module.css'
import { type Message, useRealtimeMessages } from './hooks/useRealtimeMessages'
import { getCurrentUserId } from './services'
import { sendChatMessage } from './services/aiMessageService'
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
    if (!currentUserId) return

    setIsLoading(true)

    // Send chat message to API
    const result = await sendChatMessage({
      message: content,
      schemaData,
      tableGroups,
      messages,
      designSession,
      setProgressMessages,
      currentUserId,
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

    await startAIResponse(content)
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
