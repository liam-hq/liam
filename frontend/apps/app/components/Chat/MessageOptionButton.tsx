'use client'

import { Check } from '@liam-hq/ui'
import type { FC, KeyboardEvent, MouseEvent } from 'react'
import { useCallback } from 'react'
import styles from './MessageOptionButton.module.css'

import type { AgentType } from './AgentMessage/AgentMessage'

export interface MessageOptionButtonProps {
  /**
   * The text content to display in the button
   */
  text: string
  /**
   * The agent type that determines the color theme
   */
  agentType: AgentType
  /**
   * Whether the button is selected
   */
  isSelected?: boolean
  /**
   * Whether the button is disabled
   */
  isDisabled?: boolean
  /**
   * Callback function when the button is clicked
   */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
}

/**
 * A button component for message options in the chat interface
 */
export const MessageOptionButton: FC<MessageOptionButtonProps> = ({
  text,
  agentType,
  isSelected = false,
  isDisabled = false,
  onClick,
}) => {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled && onClick) {
        onClick(event)
      }
    },
    [isDisabled, onClick],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (!isDisabled && onClick) {
          // Call onClick directly without casting the event
          onClick(
            new MouseEvent('click') as unknown as MouseEvent<HTMLButtonElement>,
          )
        }
      }
    },
    [isDisabled, onClick],
  )

  const agentClass =
    agentType === 'build' ? styles.optionButtonBuild : styles.optionButtonAsk
  const selectedClass = isSelected ? styles.optionButtonSelected : ''
  const checkIconClass =
    agentType === 'build' ? styles.checkIconBuild : styles.checkIconAsk

  return (
    <div className={styles.optionWrapper}>
      <div
        style={{
          width: '12px',
          height: '12px',
          marginRight: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isSelected && (
          <Check
            className={`${styles.checkIcon} ${checkIconClass}`}
            size={12}
            aria-hidden="true"
          />
        )}
      </div>
      <button
        className={`${styles.optionButton} ${agentClass} ${selectedClass}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        aria-label={text}
        tabIndex={0}
        type="button"
      >
        <span className={styles.optionText}>{text}</span>
      </button>
    </div>
  )
}
