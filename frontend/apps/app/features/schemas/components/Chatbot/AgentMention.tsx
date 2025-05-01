'use client'

import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './AgentMention.module.css'

// Define the agent data structure
interface Agent {
  id: string
  label: string
  description: string
  agentType: string // Corresponding AgentType value
}

// Define the list of available agents
const AGENTS: Agent[] = [
  {
    id: 'builder',
    label: 'builder',
    description: 'Designs table structures',
    agentType: 'build',
  },
  {
    id: 'reviewer',
    label: 'reviewer',
    description: 'Reviews schemas',
    agentType: 'review',
  },
  {
    id: 'learn',
    label: 'learn',
    description: 'Learns context and responds accordingly',
    agentType: 'learn',
  },
]

interface AgentMentionProps {
  inputValue: string
  cursorPosition: number
  onSelect: (
    agentId: string,
    agentType: string,
    startPos: number,
    endPos: number,
  ) => void
  onClose: () => void
  containerRef: React.RefObject<HTMLDivElement>
}

export const AgentMention: React.FC<AgentMentionProps> = ({
  inputValue,
  cursorPosition,
  onSelect,
  onClose,
  containerRef,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>(AGENTS)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Function to detect if we're in a mention context and extract the query
  const detectMention = useCallback(() => {
    // Always set isVisible to true since the component is only rendered when mentionType is 'agent'
    setIsVisible(true)

    if (cursorPosition <= 0 || inputValue.length === 0) {
      return
    }

    // Look backwards from cursor position to find the last '@' character
    let startIndex = -1
    for (let i = cursorPosition - 1; i >= 0; i--) {
      // If we find a space or beginning of input before finding '@', then we're not in a mention
      if (inputValue[i] === ' ' || inputValue[i] === '\n') {
        break
      }
      if (inputValue[i] === '@') {
        startIndex = i
        break
      }
    }

    if (startIndex === -1) {
      return
    }

    // Extract the query (text after '@')
    const query = inputValue.substring(startIndex + 1, cursorPosition)
    setMentionQuery(query)
    setMentionStartIndex(startIndex)
  }, [inputValue, cursorPosition])

  // Filter agents based on the query
  useEffect(() => {
    if (!isVisible) return

    const filtered = AGENTS.filter((agent) =>
      agent.label.toLowerCase().includes(mentionQuery.toLowerCase()),
    )
    setFilteredAgents(filtered)
    setSelectedIndex(0) // Reset selection when filter changes
  }, [mentionQuery, isVisible])

  // Detect mention when input or cursor changes
  useEffect(() => {
    detectMention()
  }, [detectMention])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isVisible) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < filteredAgents.length - 1 ? prev + 1 : prev,
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredAgents.length > 0) {
            const selectedAgent = filteredAgents[selectedIndex]
            onSelect(
              selectedAgent.id,
              selectedAgent.agentType,
              mentionStartIndex,
              mentionStartIndex + mentionQuery.length + 1,
            )
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [
      isVisible,
      filteredAgents,
      selectedIndex,
      mentionStartIndex,
      mentionQuery,
      onSelect,
      onClose,
    ],
  )

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose, containerRef])

  // Always render the dropdown since the component is only rendered when mentionType is 'agent'
  console.log('AgentMention - isVisible:', isVisible)
  console.log('AgentMention - filteredAgents:', filteredAgents)

  // If no filtered agents, show all agents
  if (filteredAgents.length === 0) {
    setFilteredAgents(AGENTS)
  }

  // Highlight matching text in agent label
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text

    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerText.indexOf(lowerQuery)

    if (index === -1) return text

    return (
      <>
        {text.substring(0, index)}
        <span className={styles.highlight}>
          {text.substring(index, index + query.length)}
        </span>
        {text.substring(index + query.length)}
      </>
    )
  }

  return (
    <div className={styles.mentionDropdown} ref={dropdownRef}>
      {filteredAgents.length > 0 ? (
        filteredAgents.map((agent, index) => (
          <div
            key={agent.id}
            className={`${styles.mentionItem} ${
              index === selectedIndex ? styles.selected : ''
            }`}
            onClick={() =>
              onSelect(
                agent.id,
                agent.agentType,
                mentionStartIndex,
                mentionStartIndex + mentionQuery.length + 1,
              )
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(
                  agent.id,
                  agent.agentType,
                  mentionStartIndex,
                  mentionStartIndex + mentionQuery.length + 1,
                )
              }
            }}
            tabIndex={0}
            role="menuitem"
            aria-selected={index === selectedIndex}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className={styles.mentionName}>
              @{highlightMatch(agent.label, mentionQuery)}
            </div>
            <div className={styles.mentionDescription}>{agent.description}</div>
          </div>
        ))
      ) : (
        <div className={styles.noResults}>No matching agents found</div>
      )}
    </div>
  )
}
