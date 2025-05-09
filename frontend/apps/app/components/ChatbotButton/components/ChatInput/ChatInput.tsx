'use client'

import { Button, Input } from '@liam-hq/ui'
import { SendIcon } from 'lucide-react'
import type { FC, FormEvent } from 'react'
import { useState } from 'react'
import styles from './ChatInput.module.css'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading: boolean
}

export const ChatInput: FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message)
      setMessage('')
    }
  }

  return (
    <form className={styles.inputContainer} onSubmit={handleSubmit}>
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask about your schema..."
        disabled={isLoading}
        className={styles.input}
      />
      <Button
        type="submit"
        disabled={!message.trim() || isLoading}
        className={styles.sendButton}
      >
        <SendIcon size={18} />
      </Button>
    </form>
  )
}
