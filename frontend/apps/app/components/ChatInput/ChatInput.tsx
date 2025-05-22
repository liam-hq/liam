'use client'
import clsx from 'clsx'
import type { ChangeEvent, FC, FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ModeToggleSwitch } from '../ModeToggleSwitch/ModeToggleSwitch'
import { CancelButton } from './CancelButton'
import styles from './ChatInput.module.css'
import { SendButton } from './SendButton'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onCancel?: () => void // New prop for cancellation
  isLoading: boolean
  error?: boolean
  initialMessage?: string
}

export const ChatInput: FC<ChatInputProps> = ({
  onSendMessage,
  onCancel,
  isLoading,
  error = false,
  initialMessage = '',
}) => {
  const [message, setMessage] = useState(initialMessage)
  const hasContent = message.trim().length > 0
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Adjust height on initial render
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'
      // Set the height to scrollHeight to fit the content
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [])

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    // Adjust height after content changes
    const textarea = e.target
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    // Set the height to scrollHeight to fit the content
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (isLoading) {
      // If loading, call onCancel
      onCancel?.()
    } else if (hasContent) {
      // If not loading and has content, send message
      onSendMessage(message)
      setMessage('')

      // Reset textarea height after sending
      setTimeout(() => {
        const textarea = textareaRef.current
        if (textarea) {
          // Reset to minimum height (single line)
          textarea.style.height = '24px'
        }
      }, 0)
    }
  }

  return (
    <div className={styles.container}>
      <form
        className={clsx(
          styles.inputContainer,
          isLoading && styles.disabled,
          isLoading && styles.loading,
          error && styles.error,
        )}
        onSubmit={handleSubmit}
      >
        <div className={styles.inputWrapper}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            placeholder="Ask anything, @ to mention schema tables"
            disabled={isLoading}
            className={styles.input}
            rows={1}
            data-error={error ? 'true' : undefined}
          />
        </div>
        {isLoading ? (
          <CancelButton
            hasContent={true} // Always treat as having content during loading
            onClick={handleSubmit}
            disabled={false} // Never disable during loading
          />
        ) : (
          <SendButton
            hasContent={hasContent}
            onClick={handleSubmit}
            disabled={isLoading || error}
          />
        )}
      </form>
      <ModeToggleSwitch className={styles.modeToggle} />
    </div>
  )
}
