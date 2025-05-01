'use client'

import { Spinner } from '@/components/Spinner'
import { useChat } from '@ai-sdk/react'
import type { Schema } from '@liam-hq/db-structure'
import { type FC, type FormEvent, useEffect, useRef } from 'react'
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

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    stop,
  } = useChat({
    api: '/api/chat/schema-edit',
    body: {
      schema,
    },
    // Removed the automatic schema modification on message completion
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
            parts={message.parts}
            onApplySchema={
              !message.role || message.role === 'user'
                ? undefined
                : (jsonSchema) => {
                    try {
                      // Process schema modification when Apply button is clicked
                      const {
                        schema: updatedSchema,
                        modified,
                        error,
                      } = processSchemaModification(jsonSchema, schema)

                      if (modified) {
                        // Apply schema changes
                        onSchemaChange(updatedSchema)
                        // Show success notification
                        showSchemaToast(
                          'Schema applied successfully',
                          'success',
                        )
                      } else if (error) {
                        // Show error notification
                        showSchemaToast(
                          `Failed to apply schema: ${error}`,
                          'error',
                        )
                      } else {
                        showSchemaToast(
                          'No changes were detected in the schema',
                          'info',
                        )
                      }
                    } catch (err) {
                      showSchemaToast(
                        `Error applying schema: ${err instanceof Error ? err.message : 'Unknown error'}`,
                        'error',
                      )
                    }
                  }
            }
          />
        ))}
        {(status === 'submitted' || status === 'streaming') && (
          <div className={styles.loadingContainer}>
            <Spinner />
            <button
              type="button"
              onClick={() => stop()}
              className={styles.stopButton}
            >
              Cancel
            </button>
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
          onSubmit={() =>
            handleSubmit({
              preventDefault: () => {},
            } as FormEvent<HTMLFormElement>)
          }
        />
      </form>
    </div>
  )
}
