'use client'

import { Button, Input } from '@liam-hq/ui'
import { AtSignIcon, SendIcon } from 'lucide-react'
import type { FC, FormEvent } from 'react'
import { useState } from 'react'
import styles from './ChatInput.module.css'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading: boolean
  mode?: 'plan' | 'act'
  onModeChange?: (mode: 'plan' | 'act') => void
  onMentionClick?: () => void
}

export const ChatInput: FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  mode = 'plan',
  onModeChange,
  onMentionClick,
}) => {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message)
      setMessage('')
    }
  }

  const handleModeChange = (newMode: 'plan' | 'act') => {
    if (onModeChange) {
      onModeChange(newMode)
    }
  }

  return (
    <div className={styles.chatInputContainer}>
      <form className={styles.inputContainer} onSubmit={handleSubmit}>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask anything (⌘L), @ to mention schema tables"
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
      <div className={styles.controlsContainer}>
        <div className={styles.modeSegmentedControl}>
          <button
            type="button"
            className={`${styles.modeButton} ${
              mode === 'plan' ? styles.activeMode : ''
            }`}
            onClick={() => handleModeChange('plan')}
          >
            Plan
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${
              mode === 'act' ? styles.activeMode : ''
            }`}
            onClick={() => handleModeChange('act')}
          >
            Act
          </button>
        </div>
        <Button
          type="button"
          onClick={onMentionClick}
          className={styles.mentionButton}
          disabled={isLoading}
        >
          <AtSignIcon size={16} />
        </Button>
      </div>
    </div>
  )
}
