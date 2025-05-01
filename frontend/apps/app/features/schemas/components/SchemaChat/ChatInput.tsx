'use client'

import { Button } from '@liam-hq/ui'
import { SendIcon } from 'lucide-react'
import { type ChangeEventHandler, type FC, type KeyboardEvent, useState } from 'react'
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
  const [isComposing, setIsComposing] = useState(false)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't submit if Shift is pressed or if currently composing (IME input)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
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
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
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
