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

  // Function to check for valid agent mentions in text and switch agent if found
  const checkForAgentMention = (text: string) => {
    // Define regex to match @agent_name at word boundaries
    const mentionRegex = /@(builder|reviewer|learn)\b/g
    const matches = text.match(mentionRegex)

    if (matches && matches.length > 0) {
      // Get the last mention (most recent)
      const lastMention = matches[matches.length - 1].substring(1) // Remove @ symbol

      // Map from mention ID to agent type
      const agentTypeMap: Record<string, AgentType> = {
        builder: 'build',
        reviewer: 'review',
        learn: 'learn',
      }

      const agentType = agentTypeMap[lastMention]

      // Switch agent if a valid mention is found and it's different from current
      if (agentType && agentType !== currentMode) {
        handleModeChange(agentType)
      }
    }
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
              const newValue = e.target.value
              setMessage(newValue)
              // Check if we should show mentions
              setShowMentions(newValue.includes('@'))
              // Check for valid agent mentions
              checkForAgentMention(newValue)
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
              onSelect={(agentId, agentType, startPos, endPos) => {
                // Insert the agent mention at the cursor position
                const newMessage = `${message.substring(0, startPos)}@${agentId} ${message.substring(endPos)}`
                setMessage(newMessage)
                setShowMentions(false)

                // Automatically switch to the mentioned agent
                if (agentType && agentType !== currentMode) {
                  handleModeChange(agentType as AgentType)
                }

                // Also check for other mentions in the message
                // This ensures we handle cases where multiple mentions exist
                checkForAgentMention(newMessage)
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
