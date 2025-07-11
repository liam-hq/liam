'use client'

import {
  Button,
  Check,
  ChevronDown,
  ChevronUp,
  IconButton,
  Spinner,
} from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, type ReactNode, useState } from 'react'
import styles from './ProcessIndicator.module.css'

export type ProcessStatus = 'processing' | 'complete'

// Get status icon based on current status
const getStatusIcon = (status: ProcessStatus): ReactNode => {
  return status === 'processing' ? <Spinner size="16" /> : <Check size={16} />
}

// Get progress fill width
const getProgressFillWidth = (
  status: ProcessStatus,
  progress: number,
): string => {
  return `${status === 'complete' ? 100 : progress}%`
}

type ProcessIndicatorProps = {
  /**
   * The title of the process
   */
  title: string
  /**
   * The subtitle description
   */
  subtitle?: string
  /**
   * The progress percentage (0-100)
   * When it reaches 100, status will automatically become 'complete'
   */
  progress?: number
  /**
   * Optional override for the status
   * If not provided, status will be 'complete' when progress is 100, otherwise 'processing'
   */
  status?: ProcessStatus
  /**
   * The label for the primary action button
   */
  primaryActionLabel?: string
  /**
   * Callback for the primary action button
   */
  onPrimaryAction?: () => void
  /**
   * The label for the secondary action button
   */
  secondaryActionLabel?: string
  /**
   * Callback for the secondary action button
   */
  onSecondaryAction?: () => void
  /**
   * Initial expanded state
   */
  initialExpanded?: boolean
}

/**
 * A component that displays the status of a process with collapsible functionality
 */
export const ProcessIndicator: FC<ProcessIndicatorProps> = ({
  title,
  subtitle,
  progress = 0,
  status,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  initialExpanded = true,
}) => {
  // State to track expanded/collapsed state
  const [isExpanded, setIsExpanded] = useState(initialExpanded)

  // Toggle expanded/collapsed state
  const handleToggle = () => {
    setIsExpanded((isExpanded) => !isExpanded)
  }

  // Limit progress to 0-100 range
  const normalizedProgress = Math.min(100, Math.max(0, progress))

  // Determine effective status - complete when progress is 100%, otherwise use provided status or default to processing
  const effectiveStatus: ProcessStatus =
    normalizedProgress >= 100 ? 'complete' : status || 'processing'

  return (
    <div
      className={styles.container}
      aria-live={effectiveStatus === 'processing' ? 'polite' : 'off'}
    >
      <div className={styles.header}>
        <div
          className={clsx(
            styles.iconContainer,
            effectiveStatus === 'processing'
              ? styles.processingIcon
              : styles.completeIcon,
          )}
        >
          {getStatusIcon(effectiveStatus)}
        </div>
        <div className={styles.titleContainer}>
          <div className={styles.title}>{title}</div>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
        <IconButton
          icon={isExpanded ? <ChevronUp /> : <ChevronDown />}
          tooltipContent={isExpanded ? 'Collapse' : 'Expand'}
          onClick={handleToggle}
          size="md"
          variant="hoverBackground"
          tooltipSide="top"
        />
      </div>

      {isExpanded && (
        <>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: getProgressFillWidth(
                    effectiveStatus,
                    normalizedProgress,
                  ),
                }}
              />
            </div>
          </div>

          <div className={styles.actionsRow}>
            <div className={styles.progressText}>
              {effectiveStatus === 'complete' ? 100 : normalizedProgress}%
            </div>

            {(primaryActionLabel || secondaryActionLabel) && (
              <div className={styles.actions}>
                {secondaryActionLabel && effectiveStatus === 'processing' && (
                  <Button
                    variant="ghost-secondary"
                    size="xs"
                    onClick={onSecondaryAction}
                  >
                    {secondaryActionLabel}
                  </Button>
                )}
                {primaryActionLabel && (
                  <Button
                    variant="outline-secondary"
                    size="xs"
                    onClick={onPrimaryAction}
                  >
                    {primaryActionLabel}
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
