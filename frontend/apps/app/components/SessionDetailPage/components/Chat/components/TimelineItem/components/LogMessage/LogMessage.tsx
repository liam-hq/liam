import clsx from 'clsx'
import type { FC } from 'react'
import styles from './LogMessage.module.css'

type LogMessageProps = {
  content: string
  isLast: boolean
  // Note: Currently timeline_items table doesn't have a status field.
  // This prop is for future use when we might want to show different states
  status?: 'success' | 'error' | 'in-progress' | 'pending'
}

export const LogMessage: FC<LogMessageProps> = ({
  content,
  isLast,
  status,
}) => {
  // Check if this is a single-line message
  const lines = content.split('\n')
  const isSingleLine = lines.length === 1

  if (isSingleLine) {
    // Use status prop if specified
    const statusIcon = (() => {
      if (status === 'error') return '✗'
      if (status === 'in-progress') return '⏳'
      if (status === 'pending') return '•'
      // If status is not specified, use isLast
      return isLast ? '⏳' : '✓'
    })()

    return (
      <div className={styles.content}>
        <div className={styles.lineContainer}>
          <span
            className={clsx(
              styles.statusIcon,
              statusIcon === '✓' && styles.checkmark,
              statusIcon === '✗' && styles.crossmark,
              statusIcon === '⏳' && styles.inProgress,
              statusIcon === '•' && styles.pendingTask,
            )}
          >
            {statusIcon}
          </span>
          <span
            className={clsx(
              styles.lineText,
              statusIcon === '⏳' && styles.currentTask,
            )}
          >
            {content}
          </span>
        </div>
      </div>
    )
  }

  // For multi-line messages, handle each line separately
  const formattedContent = lines
    .map((line, lineIndex) => {
      const trimmedLine = line.trim()

      // Skip empty lines
      if (!trimmedLine) {
        return null
      }

      // Use status prop if specified
      const isLastLine = lineIndex === lines.length - 1
      const statusIcon = (() => {
        if (status === 'error') return '✗'
        if (status === 'in-progress') return '⏳'
        if (status === 'pending') return '•'
        // If status is not specified, use isLast
        return isLast && isLastLine ? '⏳' : '✓'
      })()

      return (
        <div
          key={`line-${lineIndex}-${content.length}`}
          className={styles.lineContainer}
        >
          <span
            className={clsx(
              styles.statusIcon,
              statusIcon === '✓' && styles.checkmark,
              statusIcon === '✗' && styles.crossmark,
              statusIcon === '⏳' && styles.inProgress,
              statusIcon === '•' && styles.pendingTask,
            )}
          >
            {statusIcon}
          </span>
          <span
            className={clsx(
              styles.lineText,
              statusIcon === '⏳' && styles.currentTask,
            )}
          >
            {line}
          </span>
        </div>
      )
    })
    .filter(Boolean)

  return <div className={styles.content}>{formattedContent}</div>
}
