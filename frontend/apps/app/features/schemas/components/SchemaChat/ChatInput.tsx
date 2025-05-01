'use client'

import { Button } from '@liam-hq/ui'
import { SendIcon } from 'lucide-react'
import type { ChangeEventHandler, FC, KeyboardEvent } from 'react'
import styles from './ChatInput.module.css'

interface ChatInputProps {
  value: string
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
  isLoading: boolean
  onSubmit?: () => void
}

export const ChatInput: FC<ChatInputProps> = ({
  value,
  onChange,
  isLoading,
  onSubmit,
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading && onSubmit) {
        onSubmit()
      }
    }
  }

  return (
    <>
      <textarea
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask about your schema... (Shift+Enter for new line)"
        disabled={isLoading}
        className={styles.input}
        rows={1}
      />
      <Button
        type="submit"
        disabled={!value.trim() || isLoading}
        className={styles.sendButton}
        aria-label="Send message"
      >
        <SendIcon size={18} />
      </Button>
    </>
  )
}
