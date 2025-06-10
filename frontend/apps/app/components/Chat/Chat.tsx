'use client'

import type { Schema, TableGroup } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ChatInput } from '../ChatInput'
import type { Mode } from '../ChatInput/components/ModeToggleSwitch/ModeToggleSwitch'
import { ChatMessage } from '../ChatMessage'
import styles from './Chat.module.css'
import { type Message, useRealtimeMessages } from './hooks/useRealtimeMessages'
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

    // Create and stream AI message
    const result = await createAndStreamAIMessage({
      message: content,
      schemaData,
      tableGroups,
      messages,
      mode,
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
