'use client'

import { useChat } from '@ai-sdk/react'
import type { Schema, SchemaOverride } from '@liam-hq/db-structure'
import {
  type ChangeEvent,
  type FC,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import {
  createOrUpdateSchemaOverride,
  processSchemaOperations,
} from '../../utils/SchemaModifier'
import { showSchemaToast } from '../../utils/SchemaToast'
import { ChatInput } from '../SchemaChat/ChatInput'
import { ChatMessage } from '../SchemaChat/ChatMessage'
import styles from './SchemaChat.module.css'

// 一時的なSchemaModification処理関数（後で適切な場所に移動する）
interface SchemaModificationResult {
  schema: Schema
  modified: boolean
  error?: string
}

function processSchemaModification(
  jsonSchema: string,
  currentSchema: Schema,
): SchemaModificationResult {
  try {
    // JSONを解析
    const schemaModification = JSON.parse(jsonSchema)

    // 深いコピーを作成して元のスキーマを変更しないようにする
    const updatedSchema = JSON.parse(
      JSON.stringify(schemaModification),
    ) as Schema

    return {
      schema: updatedSchema,
      modified: true,
    }
  } catch (error) {
    return {
      schema: currentSchema,
      modified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

interface SchemaChatProps {
  schema: Schema
  onSchemaChange: (newSchema: Schema) => void
  overrideYaml?: string
  onOverrideChange?: (newOverrideYaml: string) => void
}

export const SchemaChat: FC<SchemaChatProps> = ({
  schema,
  onSchemaChange,
  overrideYaml,
  onOverrideChange,
}) => {
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
  })

  // Scroll to bottom once component is mounted
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // ストリーミング中は即時スクロール、それ以外はスムーズに
      const behavior = status === 'streaming' ? 'auto' : 'smooth'
      messagesEndRef.current?.scrollIntoView({ behavior })
    }
  }, [messages.length, status])

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h2 className={styles.chatTitle}>Schema Assistant</h2>
      </div>

      <div className={styles.messagesContainer}>
        {useMemo(
          () =>
            messages.map((message) => (
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
                            // Add error to input for AI to see
                            handleInputChange({
                              target: {
                                value: `Failed to apply schema: ${error}. Please fix this issue and provide a corrected schema.`,
                              },
                            } as ChangeEvent<HTMLTextAreaElement>)
                          } else {
                            showSchemaToast(
                              'No changes were detected in the schema',
                              'info',
                            )
                          }
                        } catch (err) {
                          const errorMessage =
                            err instanceof Error ? err.message : 'Unknown error'
                          showSchemaToast(
                            `Error applying schema: ${errorMessage}`,
                            'error',
                          )
                          // Add error to input for AI to see
                          handleInputChange({
                            target: {
                              value: `Error applying schema: ${errorMessage}. Please provide a valid schema that fixes this issue.`,
                            },
                          } as ChangeEvent<HTMLTextAreaElement>)
                        }
                      }
                }
                onApplyOperations={
                  !message.role || message.role === 'user' || !onOverrideChange
                    ? undefined
                    : (yamlOperations) => {
                        try {
                          // Process operations from YAML
                          const { operations, modified, error } =
                            processSchemaOperations(yamlOperations)

                          if (modified && operations.length > 0) {
                            // Parse current override YAML if it exists
                            let currentOverride: SchemaOverride | null = null

                            if (overrideYaml?.trim()) {
                              try {
                                currentOverride = parseYaml(
                                  overrideYaml,
                                ) as SchemaOverride
                              } catch (e) {
                                console.error(
                                  'Error parsing current override YAML:',
                                  e,
                                )
                              }
                            }

                            // Create or update schema override with new operations
                            const updatedOverride =
                              createOrUpdateSchemaOverride(
                                currentOverride,
                                operations,
                              )

                            // Convert updated override back to YAML and apply changes
                            const updatedOverrideYaml =
                              stringifyYaml(updatedOverride)
                            onOverrideChange(updatedOverrideYaml)

                            // Show success notification
                            showSchemaToast(
                              `Successfully applied ${operations.length} operations to schema override`,
                              'success',
                            )
                          } else if (error) {
                            // Show error notification
                            showSchemaToast(
                              `Failed to apply operations: ${error}`,
                              'error',
                            )
                            // Add error to input for AI to see
                            handleInputChange({
                              target: {
                                value: `Failed to apply operations: ${error}. Please fix this issue and provide corrected YAML operations.`,
                              },
                            } as ChangeEvent<HTMLTextAreaElement>)
                          } else {
                            showSchemaToast(
                              'No valid operations were found in the response',
                              'info',
                            )
                          }
                        } catch (err) {
                          const errorMessage =
                            err instanceof Error ? err.message : 'Unknown error'
                          showSchemaToast(
                            `Error applying operations: ${errorMessage}`,
                            'error',
                          )
                          // Add error to input for AI to see
                          handleInputChange({
                            target: {
                              value: `Error applying operations: ${errorMessage}. Please provide valid YAML operations that fix this issue.`,
                            },
                          } as ChangeEvent<HTMLTextAreaElement>)
                        }
                      }
                }
              />
            )),
          [
            messages,
            schema,
            overrideYaml,
            onOverrideChange,
            onSchemaChange,
            handleInputChange,
          ],
        )}
        {(status === 'submitted' || status === 'streaming') && (
          <div className={styles.loadingContainer}>
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
