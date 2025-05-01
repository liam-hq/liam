'use client'

import { Button, Input } from '@liam-hq/ui'
import { AtSignIcon, SendIcon } from 'lucide-react'
import type { FC, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { AgentSelect } from './AgentSelect'
import styles from './ChatInput.module.css'

// Define the agent type
export type AgentType = 'build' | 'learn' | 'review'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading: boolean
  mode?: AgentType
  onModeChange?: (mode: AgentType) => void
  onMentionClick?: () => void
}

export const ChatInput: FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  mode, // Remove default value here to ensure we use our internal state
  onModeChange,
  onMentionClick,
}) => {
  const [message, setMessage] = useState('')
  // Add local state to ensure we always have a valid mode, defaulting to 'build'
  const [currentMode, setCurrentMode] = useState<AgentType>('build')

  // Update local state when prop changes, but default to 'build' if undefined
  useEffect(() => {
    if (mode) {
      setCurrentMode(mode)
    }
  }, [mode])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message)
      setMessage('')
    }
  }

  const handleModeChange = (newMode: AgentType) => {
    // Update local state
    setCurrentMode(newMode)

    // Notify parent component
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
        <AgentSelect mode={currentMode} onModeChange={handleModeChange} />
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
