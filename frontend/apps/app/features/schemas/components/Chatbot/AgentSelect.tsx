'use client'

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@liam-hq/ui'
import { Check, ChevronDown } from 'lucide-react'
import type { FC } from 'react'
import styles from './AgentSelect.module.css'

interface AgentSelectProps {
  mode: 'plan' | 'act'
  onModeChange: (mode: 'plan' | 'act') => void
}

export const AgentSelect: FC<AgentSelectProps> = ({ mode, onModeChange }) => {
  const handleAgentSelect = (selectedMode: 'plan' | 'act') => {
    onModeChange(selectedMode)
  }

  return (
    <div className={styles.agentSelectContainer}>
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <button type="button" className={styles.agentSelectTrigger}>
            <span className={`${styles.iconContainer} ${styles.buildJackIcon}`}>
              {/* Green icon for Build Jack */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-labelledby="buildJackIconTitle"
              >
                <title id="buildJackIconTitle">Build Jack Icon</title>
                <path
                  d="M8 1.5L10.5 2.5V4.5C10.5 5.5 9.5 6.5 8 6.5C6.5 6.5 5.5 5.5 5.5 4.5V2.5L8 1.5Z"
                  fill="currentColor"
                />
                <path
                  d="M3 7.5V13.5C3 14.0523 3.44772 14.5 4 14.5H12C12.5523 14.5 13 14.0523 13 13.5V7.5H11.5V9.5H10V7.5H6V9.5H4.5V7.5H3Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className={styles.agentName}>
              {mode === 'plan' ? 'Build Jack' : 'Act Jack'}
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
              mode === 'plan' ? styles.activeMenuItem : ''
            }`}
            onSelect={() => handleAgentSelect('plan')}
          >
            <span className={`${styles.iconContainer} ${styles.buildJackIcon}`}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-labelledby="buildJackMenuIconTitle"
              >
                <title id="buildJackMenuIconTitle">Build Jack Icon</title>
                <path
                  d="M8 1.5L10.5 2.5V4.5C10.5 5.5 9.5 6.5 8 6.5C6.5 6.5 5.5 5.5 5.5 4.5V2.5L8 1.5Z"
                  fill="currentColor"
                />
                <path
                  d="M3 7.5V13.5C3 14.0523 3.44772 14.5 4 14.5H12C12.5523 14.5 13 14.0523 13 13.5V7.5H11.5V9.5H10V7.5H6V9.5H4.5V7.5H3Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span>Build Jack</span>
            {mode === 'plan' && (
              <span className={styles.checkIcon}>
                <Check size={16} />
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={`${styles.agentMenuItem} ${
              mode === 'act' ? styles.activeMenuItem : ''
            }`}
            onSelect={() => handleAgentSelect('act')}
          >
            <span
              className={`${styles.iconContainer} ${styles.reviewJackIcon}`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-labelledby="actJackIconTitle"
              >
                <title id="actJackIconTitle">Act Jack Icon</title>
                <path
                  d="M8 1.5L10.5 2.5V4.5C10.5 5.5 9.5 6.5 8 6.5C6.5 6.5 5.5 5.5 5.5 4.5V2.5L8 1.5Z"
                  fill="currentColor"
                />
                <path
                  d="M3 7.5V13.5C3 14.0523 3.44772 14.5 4 14.5H12C12.5523 14.5 13 14.0523 13 13.5V7.5H11.5V9.5H10V7.5H6V9.5H4.5V7.5H3Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span>Act Jack</span>
            {mode === 'act' && (
              <span className={styles.checkIcon}>
                <Check size={16} />
              </span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>
    </div>
  )
}
