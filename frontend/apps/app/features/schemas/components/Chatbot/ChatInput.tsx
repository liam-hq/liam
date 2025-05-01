'use client'

import { Button, Input } from '@liam-hq/ui'
import { AtSignIcon, SendIcon } from 'lucide-react'
import type { FC, FormEvent } from 'react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { AgentMention } from './AgentMention'
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
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showMentions, setShowMentions] = useState(false)
  // Add local state to ensure we always have a valid mode, defaulting to 'build'
  const [currentMode, setCurrentMode] = useState<AgentType>('build')
  const inputContainerRef = useRef<HTMLDivElement>(null)

  // Update local state when prop changes, but default to 'build' if undefined
  useEffect(() => {
    if (mode) {
      setCurrentMode(mode)
    }
  }, [mode])

  // Handle cursor position changes
  const handleCursorChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    setCursorPosition(input.selectionStart || 0)
  }

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
        <div ref={inputContainerRef} className={styles.inputWrapper}>
          <Input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              // Check if we should show mentions
              setShowMentions(e.target.value.includes('@'))
            }}
            onSelect={handleCursorChange}
            onKeyUp={handleCursorChange}
            onKeyDown={handleCursorChange}
            onClick={handleCursorChange}
            placeholder="Ask anything (⌘L), @ to mention schema tables"
            disabled={isLoading}
            className={styles.input}
          />
          {showMentions && (
            <AgentMention
              inputValue={message}
              cursorPosition={cursorPosition}
              onSelect={(agentId, startPos, endPos) => {
                // Insert the agent mention at the cursor position
                const newMessage = `${message.substring(0, startPos)}@${agentId} ${message.substring(endPos)}`
                setMessage(newMessage)
                setShowMentions(false)
              }}
              onClose={() => setShowMentions(false)}
              containerRef={inputContainerRef}
            />
          )}
        </div>
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
