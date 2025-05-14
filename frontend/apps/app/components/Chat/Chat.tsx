'use client'

import type { TableGroupData } from '@/app/api/chat/route'
import type { Schema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ChatInput } from '../ChatInput'
import { ChatMessage, type ChatMessageProps } from '../ChatMessage'
import styles from './Chat.module.css'

interface Props {
  schemaData: Schema
  tableGroups?: Record<string, TableGroupData>
}

export const Chat: FC<Props> = ({ schemaData, tableGroups }) => {
  const [messages, setMessages] = useState<
    (ChatMessageProps & { id: string })[]
  >([
    {
      id: 'welcome',
      content:
        'Hello! Feel free to ask questions about your schema or consult about database design.',
      isUser: false,
      timestamp: new Date(),
      isGenerating: false, // Explicitly set to false for consistency
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
      isGenerating: false, // Explicitly set to false for consistency
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
        isGenerating: true, // Mark as generating
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
          // Streaming is complete, add timestamp and remove isGenerating
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    content: accumulatedContent,
                    timestamp: new Date(),
                    isGenerating: false, // Remove generating state when complete
                  }
                : msg,
            ),
          )
          break
        }

        // Decode the chunk and append to accumulated content
        const chunk = new TextDecoder().decode(value)
        accumulatedContent += chunk

        // Update the AI message with the accumulated content (without timestamp)
        // Keep isGenerating: true during streaming
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: accumulatedContent, isGenerating: true }
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
          // Update the existing empty message with error, add timestamp, and remove generating state
          const updatedMessages = [...prev]
          updatedMessages[aiMessageIndex] = {
            ...updatedMessages[aiMessageIndex],
            content: 'Sorry, an error occurred. Please try again.',
            timestamp: new Date(),
            isGenerating: false, // Remove generating state on error
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
            isGenerating: false, // Ensure error message is not in generating state
          },
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            content={message.content}
            isUser={message.isUser}
            timestamp={message.timestamp}
            isGenerating={message.isGenerating}
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
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  )
}
