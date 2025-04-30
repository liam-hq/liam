'use client'

import { Button, Input } from '@liam-hq/ui'
import { SendIcon } from 'lucide-react'
import type { ChangeEventHandler, FC } from 'react'
import styles from './ChatInput.module.css'

interface ChatInputProps {
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  isLoading: boolean
}

export const ChatInput: FC<ChatInputProps> = ({
  value,
  onChange,
  isLoading,
}) => {
  return (
    <>
      <Input
        value={value}
        onChange={onChange}
        placeholder="Ask about your schema..."
        disabled={isLoading}
        className={styles.input}
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
