'use client'

import {
  DrawerClose,
  DrawerContent,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  IconButton,
} from '@liam-hq/ui'
import { X as CloseIcon } from 'lucide-react'
import type { FC, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import type {
  SchemaData,
  TableGroupData,
} from '../../../../../app/api/chat/route'
import { AskAiIcon } from '../AskAiIcon'
import type { AgentType } from '../ChatInput'
import { ChatInput } from '../ChatInput'
import { ChatMessage, type ChatMessageProps } from '../ChatMessage'
import styles from './ChatbotDrawer.module.css'

interface ChatbotDrawerRootProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export const ChatbotDrawerRoot: FC<ChatbotDrawerRootProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  return (
    <DrawerRoot
      direction="right"
      // Set snapPoints to an empty array to disable the drawer snapping functionality.
      snapPoints={[]}
      open={isOpen}
      onClose={onClose}
      modal={false}
    >
      {children}
    </DrawerRoot>
  )
}

interface ChatbotDrawerProps {
  schemaData: SchemaData
  tableGroups?: Record<string, TableGroupData>
}

export const ChatbotDrawer: FC<ChatbotDrawerProps> = ({
  schemaData,
  tableGroups,
}) => {
  const [messages, setMessages] = useState<
    (ChatMessageProps & { id: string })[]
  >([
    {
      id: 'welcome',
      content:
        'Hello! Feel free to ask questions about your schema or consult about database design.',
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<AgentType>('build')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when component mounts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      content,
      isUser: true,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Create AI message placeholder for streaming (without timestamp)
    const aiMessageId = `ai-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: aiMessageId,
        content: '',
        isUser: false,
        // No timestamp during streaming
      },
    ])

    try {
      // Format chat history for API
      const history = messages
        .filter((msg) => msg.id !== 'welcome')
        .map((msg) => [msg.isUser ? 'Human' : 'AI', msg.content])

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
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      // Process the streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      let accumulatedContent = ''

      // Read the stream
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // Streaming is complete, add timestamp
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: accumulatedContent, timestamp: new Date() }
                : msg,
            ),
          )
          break
        }

        // Decode the chunk and append to accumulated content
        const chunk = new TextDecoder().decode(value)
        accumulatedContent += chunk

        // Update the AI message with the accumulated content (without timestamp)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: accumulatedContent }
              : msg,
          ),
        )

        // Scroll to bottom as content streams in
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Update error in the AI message or add a new error message
      setMessages((prev) => {
        // Check if we already added an AI message that we can update
        const aiMessageIndex = prev.findIndex((msg) => msg.id.startsWith('ai-'))

        if (aiMessageIndex >= 0 && prev[aiMessageIndex].content === '') {
          // Update the existing empty message with error and add timestamp
          const updatedMessages = [...prev]
          updatedMessages[aiMessageIndex] = {
            ...updatedMessages[aiMessageIndex],
            content: 'Sorry, an error occurred. Please try again.',
            timestamp: new Date(),
          }
          return updatedMessages
        }

        // Add a new error message with timestamp
        return [
          ...prev,
          {
            id: `error-${Date.now()}`,
            content: 'Sorry, an error occurred. Please try again.',
            isUser: false,
            timestamp: new Date(),
          },
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DrawerPortal>
      <DrawerContent className={styles.content}>
        <div className={styles.chatHeader}>
          <div className={styles.titleContainer}>
            <span className={styles.titleIcon}>
              <AskAiIcon size={16} />
            </span>
            <DrawerTitle>Ask AI</DrawerTitle>
          </div>
          <DrawerClose asChild>
            <IconButton
              icon={<CloseIcon size={16} />}
              tooltipContent="Close"
              aria-label="Close chatbot"
              className={styles.closeButton}
            />
          </DrawerClose>
        </div>
        <div className={styles.messagesContainer}>
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              isUser={message.isUser}
              timestamp={message.timestamp}
              className={
                message.isUser ? styles.askMessage : styles.responseMessage
              }
            />
          ))}
          {isLoading && (
            <div className={styles.loadingIndicator}>
              <div className={styles.loadingDot} />
              <div className={styles.loadingDot} />
              <div className={styles.loadingDot} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className={styles.chatInputContainer}>
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            mode={mode}
            onModeChange={setMode}
            onMentionClick={() => {
              // Handle mention click - can be implemented later
              // For now, this is a placeholder for future functionality
            }}
          />
        </div>
      </DrawerContent>
    </DrawerPortal>
  )
}
