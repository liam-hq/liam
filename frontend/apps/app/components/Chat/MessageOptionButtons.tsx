'use client'

import type { FC, MouseEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import type { AgentType } from './AgentMessage/AgentMessage'
import { MessageOptionButton } from './MessageOptionButton'
import styles from './MessageOptionButton.module.css'

export interface MessageOption {
  /**
   * Unique identifier for the option
   */
  id: string
  /**
   * The text content to display in the button
   */
  text: string
  /**
   * Whether the option is disabled
   */
  disabled?: boolean
}

interface MessageOptionButtonsProps {
  /**
   * The list of options to display
   */
  options: MessageOption[]
  /**
   * The agent type that determines the color theme
   */
  agentType: AgentType
  /**
   * The ID of the selected option
   */
  selectedOptionId?: string
  /**
   * Whether to allow multiple selections
   */
  multiSelect?: boolean
  /**
   * Callback function when an option is selected
   */
  onSelect?: (optionId: string, selected: boolean) => void
}

/**
 * A component that renders a list of message options
 */
export const MessageOptionButtons: FC<MessageOptionButtonsProps> = ({
  options,
  agentType,
  selectedOptionId,
  multiSelect = false,
  onSelect,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    selectedOptionId ? [selectedOptionId] : [],
  )

  // Keep internal state in sync with prop changes
  useEffect(() => {
    if (selectedOptionId) {
      setSelectedIds([selectedOptionId])
    }
  }, [selectedOptionId])

  const handleOptionClick = useCallback(
    (optionId: string) => (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()

      if (multiSelect) {
        // For multi-select, toggle the selection
        setSelectedIds((prev) => {
          const isSelected = prev.includes(optionId)
          const newSelectedIds = isSelected
            ? prev.filter((id) => id !== optionId)
            : [...prev, optionId]

          if (onSelect) {
            onSelect(optionId, !isSelected)
          }

          return newSelectedIds
        })
      } else {
        // For single-select, replace the selection
        const isSelected = selectedIds.includes(optionId)
        if (!isSelected) {
          setSelectedIds([optionId])
          if (onSelect) {
            onSelect(optionId, true)
          }
        }
      }
    },
    [multiSelect, onSelect, selectedIds],
  )

  return (
    <div className={styles.optionsContainer}>
      {options.map((option) => {
        const isSelected = selectedIds.includes(option.id)
        // Disable options that are not selected or are explicitly disabled
        // In multi-select mode, only disable if explicitly set as disabled
        const isDisabled =
          option.disabled ||
          (!multiSelect && selectedIds.length > 0 && !isSelected)

        return (
          <MessageOptionButton
            key={option.id}
            text={option.text}
            agentType={agentType}
            isSelected={isSelected}
            isDisabled={isDisabled}
            onClick={isDisabled ? undefined : handleOptionClick(option.id)}
          />
        )
      })}
    </div>
  )
}
