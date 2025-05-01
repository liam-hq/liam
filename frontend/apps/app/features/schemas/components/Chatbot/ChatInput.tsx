'use client'

import { Button, Input } from '@liam-hq/ui'
import { AtSignIcon, SendIcon } from 'lucide-react'
import type { FC, FormEvent } from 'react'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { SchemaData, TableGroupData } from '../../../../app/api/chat/route'
import { AgentMention } from './AgentMention'
import { AgentSelect } from './AgentSelect'
import styles from './ChatInput.module.css'
import { SchemaItemMention } from './SchemaItemMention'

// Define the agent type
export type AgentType = 'build' | 'learn' | 'review'

// Define the mention type
type MentionType = 'agent' | 'schemaItem' | null

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading: boolean
  mode?: AgentType
  onModeChange?: (mode: AgentType) => void
  onMentionClick?: () => void
  schemaData: SchemaData
  tableGroups?: Record<string, TableGroupData>
}

export const ChatInput: FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  mode, // Remove default value here to ensure we use our internal state
  onModeChange,
  onMentionClick,
  schemaData,
  tableGroups,
}) => {
  const [message, setMessage] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [mentionType, setMentionType] = useState<MentionType>(null)
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

  // Function to detect mention type based on cursor position and input value
  const detectMentionType = useCallback(() => {
    if (cursorPosition <= 0 || message.length === 0) {
      setMentionType(null)
      return
    }

    // Look backwards from cursor position to find the last '@' character
    let startIndex = -1
    for (let i = cursorPosition - 1; i >= 0; i--) {
      // If we find a space or beginning of input before finding '@', then we're not in a mention
      if (message[i] === ' ' || message[i] === '\n') {
        break
      }
      if (message[i] === '@') {
        startIndex = i
        break
      }
    }

    if (startIndex === -1) {
      setMentionType(null)
      return
    }

    // Extract the query (text after '@')
    const query = message.substring(startIndex + 1, cursorPosition)

    // Check if it's an agent mention
    if (/^(builder|reviewer|learn)$/i.test(query)) {
      setMentionType('agent')
    } else {
      // Default to schema item mention
      setMentionType('schemaItem')
    }
  }, [message, cursorPosition])

  // Detect mention type when input or cursor changes
  useEffect(() => {
    detectMentionType()
  }, [detectMentionType])

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
          {mentionType === 'agent' && (
            <AgentMention
              inputValue={message}
              cursorPosition={cursorPosition}
              onSelect={(agentId, agentType, startPos, endPos) => {
                // Insert the agent mention at the cursor position
                const newMessage = `${message.substring(0, startPos)}@${agentId} ${message.substring(endPos)}`
                setMessage(newMessage)
                setMentionType(null)

                // Automatically switch to the mentioned agent
                if (agentType && agentType !== currentMode) {
                  handleModeChange(agentType as AgentType)
                }

                // Also check for other mentions in the message
                // This ensures we handle cases where multiple mentions exist
                checkForAgentMention(newMessage)
              }}
              onClose={() => setMentionType(null)}
              containerRef={inputContainerRef}
            />
          )}
          {mentionType === 'schemaItem' && (
            <SchemaItemMention
              inputValue={message}
              cursorPosition={cursorPosition}
              schemaData={schemaData}
              tableGroups={tableGroups}
              onSelect={(itemId, startPos, endPos) => {
                // Insert the schema item mention at the cursor position
                const newMessage = `${message.substring(0, startPos)}@${itemId} ${message.substring(endPos)}`
                setMessage(newMessage)
                setMentionType(null)
              }}
              onClose={() => setMentionType(null)}
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
