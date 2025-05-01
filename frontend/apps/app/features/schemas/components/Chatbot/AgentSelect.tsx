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
import { BuildJackIcon, FixJackIcon } from './icons'

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
              <BuildJackIcon size={16} />
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
              <BuildJackIcon size={16} />
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
              <FixJackIcon size={16} />
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
