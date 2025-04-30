'use client'

import { useChat } from '@ai-sdk/react'
import type { Schema } from '@liam-hq/db-structure'
import { type FC, useEffect, useRef } from 'react'
import { processSchemaModification } from '../../utils/SchemaModifier'
import { showSchemaToast } from '../../utils/SchemaToast'
import { ChatInput } from '../SchemaChat/ChatInput'
import { ChatMessage } from '../SchemaChat/ChatMessage'
import styles from './SchemaChat.module.css'

interface SchemaChatProps {
  schema: Schema
  onSchemaChange: (newSchema: Schema) => void
}

export const SchemaChat: FC<SchemaChatProps> = ({ schema, onSchemaChange }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, status, error } =
    useChat({
      api: '/api/chat/schema-edit',
      body: {
        schema,
      },
      onFinish: (message) => {
        // Process AI response to extract and apply schema modifications
        const {
          schema: updatedSchema,
          modified,
          error,
        } = processSchemaModification(message.content, schema)

        if (modified) {
          // Apply schema changes
          onSchemaChange(updatedSchema)
          // Show success notification
          showSchemaToast('Schema modified successfully', 'success')
        } else if (error) {
          // Show error notification
          showSchemaToast(`Failed to modify schema: ${error}`, 'error')
        }
      },
    })

  // Scroll to bottom once component is mounted
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h2 className={styles.chatTitle}>Schema Assistant</h2>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            content={message.content}
            isUser={message.role === 'user'}
            timestamp={
              message.createdAt ? new Date(message.createdAt) : undefined
            }
          />
        ))}
        {status === 'streaming' && (
          <div className={styles.loadingIndicator}>
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
          </div>
        )}
        {error && (
          <div className={styles.errorMessage}>
            エラーが発生しました。もう一度お試しください。
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputContainer} onSubmit={handleSubmit}>
        <ChatInput
          value={input}
          onChange={handleInputChange}
          isLoading={status !== 'ready'}
        />
      </form>
    </div>
  )
}
