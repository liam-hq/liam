'use client'

import { ChatInput } from '@/components/ChatInput'
import { ChatMessage, type ChatMessageProps } from '@/components/ChatMessage'
import type { Schema } from '@liam-hq/db-structure'
import {
  ModalContent,
  ModalOverlay,
  ModalPortal,
  ModalRoot,
  ModalTitle,
} from '@liam-hq/ui'
import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { TableGroupData } from '../../../../app/api/chat/route'
import styles from './ChatbotDialog.module.css'

interface ChatbotDialogProps {
  isOpen: boolean
  onClose: () => void
  schemaData: Schema
  tableGroups?: Record<string, TableGroupData>
}

export const ChatbotDialog: FC<ChatbotDialogProps> = ({
  isOpen,
  onClose,
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
    <ModalRoot open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent className={styles.dialog}>
          <ModalTitle>Schema Chatbot</ModalTitle>
          <div className={styles.messagesContainer}>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                isUser={message.isUser}
                timestamp={message.timestamp}
                isGenerating={
                  isLoading &&
                  message.id.startsWith('ai-') &&
                  !message.timestamp
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </ModalContent>
      </ModalPortal>
    </ModalRoot>
  )
}
