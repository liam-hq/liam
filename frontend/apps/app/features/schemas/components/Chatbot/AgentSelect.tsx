'use client'

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@liam-hq/ui'
import { Check, ChevronDown } from 'lucide-react'
import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import styles from './AgentSelect.module.css'
import type { AgentType } from './ChatInput'
import { BuildJackIcon, FixJackIcon, LearnJackIcon } from './icons'

interface AgentSelectProps {
  mode?: AgentType // Make mode optional
  onModeChange: (mode: AgentType) => void
}

export const AgentSelect: FC<AgentSelectProps> = ({
  mode = 'build', // Default to 'build' if not provided
  onModeChange,
}) => {
  // Track if this is the initial render
  const isInitialRender = useRef(true)

  // Add local state to ensure we always have a valid mode
  const [currentMode, setCurrentMode] = useState<AgentType>('build')

  // Force initial mode to 'build' and handle initialization
  useEffect(() => {
    // Only run this logic during the initial render
    if (isInitialRender.current) {
      setCurrentMode('build')

      // If we're initializing with 'build', notify the parent
      if (onModeChange && mode !== 'build') {
        onModeChange('build')
      }

      // Mark initial render as complete
      isInitialRender.current = false
    }
  }, [mode, onModeChange]) // Include all dependencies

  // Update local state when prop changes, but only after initial render
  useEffect(() => {
    if (!isInitialRender.current && mode) {
      setCurrentMode(mode)
    }
  }, [mode]) // isInitialRender is a ref, not a state variable, so it doesn't need to be in the dependency array

  const handleAgentSelect = (selectedMode: AgentType) => {
    setCurrentMode(selectedMode)
    onModeChange(selectedMode)
  }

  const getIconForMode = (agentType: AgentType) => {
    switch (agentType) {
      case 'build':
        return <BuildJackIcon size={16} />
      case 'review':
        return <FixJackIcon size={16} />
      case 'learn':
        return <LearnJackIcon size={16} />
      default:
        return <BuildJackIcon size={16} /> // Fallback to Build Jack
    }
  }

  const getIconClassForMode = (agentType: AgentType) => {
    switch (agentType) {
      case 'build':
        return styles.buildJackIcon
      case 'review':
        return styles.reviewJackIcon
      case 'learn':
        return styles.learnJackIcon
      default:
        return styles.buildJackIcon // Fallback to Build Jack
    }
  }

  const getNameForMode = (agentType: AgentType) => {
    switch (agentType) {
      case 'build':
        return 'Build Jack'
      case 'review':
        return 'Review Jack'
      case 'learn':
        return 'Learn Jack'
      default:
        return 'Build Jack' // Fallback to Build Jack
    }
  }

  // Force Build Jack as default if no mode is selected or during initial render
  const displayMode = isInitialRender.current ? 'build' : currentMode || 'build'

  return (
    <div className={styles.agentSelectContainer}>
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <button type="button" className={styles.agentSelectTrigger}>
            <span
              className={`${styles.iconContainer} ${getIconClassForMode(displayMode)}`}
              style={{ opacity: 1 }} // Ensure icon is visible
            >
              {getIconForMode(displayMode)}
            </span>
            <span
              className={styles.agentName}
              style={{ opacity: 1 }} // Ensure text is visible
            >
              {getNameForMode(displayMode)}
            </span>
            <span className={`${styles.iconContainer} ${styles.chevronIcon}`}>
              <ChevronDown size={16} />
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={styles.agentDropdownContent}
          align="start"
        >
          <DropdownMenuItem
            className={`${styles.agentMenuItem} ${
              displayMode === 'build' ? styles.activeMenuItem : ''
            }`}
            onSelect={() => handleAgentSelect('build')}
          >
            <span className={`${styles.iconContainer} ${styles.buildJackIcon}`}>
              <BuildJackIcon size={16} />
            </span>
            <span>Build Jack</span>
            {/* Always show checkmark for Build Jack during initial render */}
            <span
              className={styles.checkIcon}
              style={{
                opacity:
                  isInitialRender.current || displayMode === 'build' ? 1 : 0,
                marginLeft: 'auto', // Ensure it's positioned at the right
                display: 'flex', // Ensure it takes up space even when invisible
                color: 'var(--color-green-400)', // Ensure the color is visible
              }}
            >
              <Check size={18} /> {/* Slightly larger for better visibility */}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className={`${styles.agentMenuItem} ${
              displayMode === 'review' ? styles.activeMenuItem : ''
            }`}
            onSelect={() => handleAgentSelect('review')}
          >
            <span
              className={`${styles.iconContainer} ${styles.reviewJackIcon}`}
            >
              <FixJackIcon size={16} />
            </span>
            <span>Review Jack</span>
            <span
              className={styles.checkIcon}
              style={{
                opacity: displayMode === 'review' ? 1 : 0,
                marginLeft: 'auto', // Ensure it's positioned at the right
                display: 'flex', // Ensure it takes up space even when invisible
                color: 'var(--color-green-400)', // Ensure the color is visible
              }}
            >
              <Check size={18} />
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className={`${styles.agentMenuItem} ${
              displayMode === 'learn' ? styles.activeMenuItem : ''
            }`}
            onSelect={() => handleAgentSelect('learn')}
          >
            <span className={`${styles.iconContainer} ${styles.learnJackIcon}`}>
              <LearnJackIcon size={16} />
            </span>
            <span>Learn Jack</span>
            <span
              className={styles.checkIcon}
              style={{
                opacity: displayMode === 'learn' ? 1 : 0,
                marginLeft: 'auto', // Ensure it's positioned at the right
                display: 'flex', // Ensure it takes up space even when invisible
                color: 'var(--color-green-400)', // Ensure the color is visible
              }}
            >
              <Check size={18} />
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>
    </div>
  )
}
