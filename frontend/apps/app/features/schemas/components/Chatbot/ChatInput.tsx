'use client'

import { Button, Input } from '@liam-hq/ui'
import { AtSignIcon, Mic, MicOff, SendIcon } from 'lucide-react'
import type { FC, FormEvent } from 'react'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
// Add type definition for SpeechRecognition if not available in the global namespace
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionError extends Event {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionError) => void) | null
  onend: (() => void) | null
}

// Add global declarations
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}
import type { SchemaData, TableGroupData } from '../../../../app/api/chat/route'
import { AgentMention } from './AgentMention'
import { AgentSelect } from './AgentSelect'
import styles from './ChatInput.module.css'
import { CombinedMention } from './CombinedMention'
import { SchemaItemMention } from './SchemaItemMention'
import type { ContextPriority } from './utils/detectContextPriority'
import { detectContextPriority } from './utils/detectContextPriority'
import type { SchemaMentionType } from './utils/detectSchemaMentionType'
import { detectSchemaMentionType } from './utils/detectSchemaMentionType'
import type { SchemaItem } from './utils/schemaItemsAdapter'
import { convertSchemaToMentionItems } from './utils/schemaItemsAdapter'

// Define the agent type
export type AgentType = 'build' | 'learn' | 'review'

// Define the mention type
type MentionType = 'agent' | 'schemaItem' | 'both' | null

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
  // Add state for context priority
  const [contextPriority, setContextPriority] = useState<ContextPriority>(null)
  // Add state for schema mention type
  const [schemaMentionType, setSchemaMentionType] =
    useState<SchemaMentionType>(null)
  // Add state for speech recognition
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const [allItems, setAllItems] = useState<SchemaItem[]>([])

  // Initialize speech recognition
  useEffect(() => {
    // Initialize speech recognition only on client side
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.lang = 'ja-JP'
        recognition.interimResults = false
        recognition.continuous = false

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          setMessage((prev) => prev + transcript)
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognition.onerror = (event) => {
          console.error('Speech recognition error', event.error)
          setIsListening(false)
        }

        recognitionRef.current = recognition
      }
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop()
      }
    }
  }, [isListening]) // Add isListening as a dependency

  // Initialize schema items when schema data changes
  useEffect(() => {
    if (schemaData) {
      const items = convertSchemaToMentionItems(schemaData, tableGroups)
      setAllItems(items)
    }
  }, [schemaData, tableGroups])

  // Update local state when prop changes, but default to 'build' if undefined
  useEffect(() => {
    if (mode) {
      setCurrentMode(mode)
    }
  }, [mode])

  // Handle cursor position changes
  const handleCursorChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const newPosition = input.selectionStart || 0
    setCursorPosition(newPosition)
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

    // Detect schema mention type
    const schemaType = detectSchemaMentionType(query)
    setSchemaMentionType(schemaType)

    // If a schema type is detected, prioritize showing schema items
    if (schemaType) {
      setMentionType('schemaItem')
      return
    }

    // Special case: if query starts with "j" or "agent", show agent mention
    if (
      query.toLowerCase().startsWith('j') ||
      query.toLowerCase().startsWith('agent')
    ) {
      setMentionType('agent')
      setContextPriority('agent')
      return
    }

    // Agent names
    const agentNames = ['builder', 'reviewer', 'learn']

    // Check if query could match an agent name
    const matchesAgentPrefix = agentNames.some((name) =>
      name.toLowerCase().startsWith(query.toLowerCase()),
    )

    // Check if query could match a schema item
    const matchesSchemaItem = allItems.some((item) =>
      item.label.toLowerCase().includes(query.toLowerCase()),
    )

    if (matchesAgentPrefix && !matchesSchemaItem) {
      setMentionType('agent')
    } else if (!matchesAgentPrefix && matchesSchemaItem) {
      setMentionType('schemaItem')
    } else if (matchesAgentPrefix && matchesSchemaItem) {
      // Both match, show combined view
      setMentionType('both')
    } else if (query === '') {
      // Empty query, show both
      setMentionType('both')

      // When @ is typed, analyze the preceding text to determine context priority
      if (startIndex > 0) {
        const precedingText = message.substring(0, startIndex)
        const priority = detectContextPriority(precedingText)
        setContextPriority(priority)
      }
    } else {
      // No matches, default to schema items as they're more numerous
      setMentionType('schemaItem')
    }
  }, [message, cursorPosition, allItems])

  // Detect mention type when input or cursor changes
  useEffect(() => {
    detectMentionType()
  }, [detectMentionType])

  // Function to check for valid agent mentions in text and switch agent if found
  const checkForAgentMention = (text: string) => {
    // Define regex to match @agent_name at word boundaries
    // Exclude 'jack' from auto-switching, only include actual agents
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

  // Handle agent selection
  const handleAgentSelect = (
    agentId: string,
    agentType: string,
    startPos: number,
    endPos: number,
  ) => {
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
  }

  // Handle schema item selection
  const handleSchemaItemSelect = (
    itemId: string,
    startPos: number,
    endPos: number,
  ) => {
    // Insert the schema item mention at the cursor position
    const newMessage = `${message.substring(0, startPos)}@${itemId} ${message.substring(endPos)}`
    setMessage(newMessage)
    setMentionType(null)
  }

  // Handle toggle speech recognition
  const handleToggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      console.error('Speech Recognition is not supported in this browser')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (error) {
        console.error('Failed to start speech recognition:', error)
        setIsListening(false)
      }
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
              onSelect={handleAgentSelect}
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
              onSelect={handleSchemaItemSelect}
              onClose={() => setMentionType(null)}
              containerRef={inputContainerRef}
              type={schemaMentionType}
            />
          )}
          {mentionType === 'both' && (
            <CombinedMention
              inputValue={message}
              cursorPosition={cursorPosition}
              schemaData={schemaData}
              tableGroups={tableGroups}
              onAgentSelect={handleAgentSelect}
              onSchemaItemSelect={handleSchemaItemSelect}
              onClose={() => setMentionType(null)}
              containerRef={inputContainerRef}
              contextPriority={contextPriority}
              schemaMentionType={schemaMentionType}
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
        <div className={styles.buttonGroup}>
          <Button
            type="button"
            onClick={onMentionClick}
            className={styles.mentionButton}
            disabled={isLoading}
          >
            <AtSignIcon size={16} />
          </Button>
          <Button
            type="button"
            onClick={handleToggleSpeechRecognition}
            className={`${styles.micButton} ${isListening ? styles.recording : ''}`}
            disabled={isLoading}
            aria-label={isListening ? '音声入力を停止' : '音声入力を開始'}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </Button>
        </div>
      </div>
    </div>
  )
}
