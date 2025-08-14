'use client'

import clsx from 'clsx'
import { type FC, type FormEvent, useEffect, useRef, useState } from 'react'
import styles from './StreamChat.module.css'

type Message = {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt?: Date
}

type Props = {
  messages: Message[]
  input: string
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onSendMessage?: (content: string) => Promise<void>
  isLoading: boolean
  error?: Error | null
  onRetry?: () => void
  onStop?: () => void
  onClear?: () => void
  threadId?: string
  designSessionId: string
}

export const StreamChat: FC<Props> = ({
  messages,
  input,
  onInputChange,
  onSubmit,
  onSendMessage,
  isLoading,
  error,
  onRetry,
  onStop,
  onClear,
  threadId,
  designSessionId,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [localInput, setLocalInput] = useState('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleLocalSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const messageContent = localInput.trim()
    
    if (!messageContent) return

    if (onSendMessage) {
      setLocalInput('')
      await onSendMessage(messageContent)
    } else {
      onSubmit(e)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) {
        form.requestSubmit()
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Stream POC</h1>
        <div className={styles.metadata}>
          <span className={styles.sessionId}>Session: {designSessionId.slice(0, 8)}...</span>
          {threadId && (
            <span className={styles.threadId}>Thread: {threadId.slice(0, 8)}...</span>
          )}
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className={styles.clearButton}
            disabled={messages.length === 0}
          >
            Clear Chat
          </button>
        )}
      </div>

      <div className={styles.messagesContainer}>
        {messages.length === 0 && !isLoading && (
          <div className={styles.emptyState}>
            <p>Start a conversation by typing a message below.</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={clsx(
              styles.messageWrapper,
              message.role === 'user' ? styles.userMessage : styles.assistantMessage,
            )}
          >
            <div className={styles.messageRole}>
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className={styles.messageContent}>
              {message.content.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < message.content.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
            {message.createdAt && (
              <div className={styles.messageTime}>
                {new Date(message.createdAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className={styles.loadingWrapper}>
            <div className={styles.typingIndicator}>
              <span />
              <span />
              <span />
            </div>
            {onStop && (
              <button
                type="button"
                onClick={onStop}
                className={styles.stopButton}
              >
                Stop generating
              </button>
            )}
          </div>
        )}

        {error && (
          <div className={styles.errorWrapper}>
            <div className={styles.errorMessage}>
              <strong>Error:</strong> {error.message}
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className={styles.retryButton}
              >
                Retry
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleLocalSubmit} className={styles.inputForm}>
        <div className={styles.inputWrapper}>
          <textarea
            value={onSendMessage ? localInput : input}
            onChange={onSendMessage 
              ? (e) => setLocalInput(e.target.value)
              : onInputChange
            }
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className={styles.input}
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || (!onSendMessage ? !input.trim() : !localInput.trim())}
            className={styles.sendButton}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}