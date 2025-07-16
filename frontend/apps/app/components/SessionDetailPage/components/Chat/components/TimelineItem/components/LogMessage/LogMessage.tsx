import clsx from 'clsx'
import type { FC } from 'react'
import styles from './LogMessage.module.css'

type LogMessageProps = {
  content: string
}

export const LogMessage: FC<LogMessageProps> = ({ content }) => {
  // Split content by lines to handle each task separately
  const lines = content.split('\n')

  const formattedContent = lines.map((line, lineIndex) => {
    // Check if this line is a pending task (starts with •)
    const isPending = line.trim().startsWith('•')
    // Check if this line is currently running (starts with ⏳)
    const isCurrentTask = line.includes('⏳')
    // Check if this line has a checkmark or crossmark
    const hasCheckOrCross = line.includes('✓') || line.includes('✗')

    // Replace ✓, ✗, ⏳, and style • lines
    const parts = line.split(/(\s*✓\s*|\s*✗\s*|⏳)/).map((part, _partIndex) => {
      if (part.includes('✓')) {
        return (
          <span
            key={`${lineIndex}-check-${part.trim()}`}
            className={styles.checkmark}
          >
            {part}
          </span>
        )
      }
      if (part.includes('✗')) {
        return (
          <span
            key={`${lineIndex}-cross-${part.trim()}`}
            className={styles.crossmark}
          >
            {part}
          </span>
        )
      }
      if (part === '⏳') {
        return <span key="hourglass-symbol">{part}</span>
      }
      return part
    })

    if (hasCheckOrCross || isCurrentTask) {
      return (
        <span
          key={`line-${lineIndex}-${line.substring(0, 10)}`}
          className={clsx(
            styles.indentedLine,
            isPending ? styles.pendingTask : '',
            isCurrentTask ? styles.currentTask : '',
          )}
        >
          {parts}
          {lineIndex < lines.length - 1 && '\n'}
        </span>
      )
    }

    return (
      <span
        key={`line-${lineIndex}-${line.substring(0, 10)}`}
        className={isPending ? styles.pendingTask : undefined}
      >
        {parts}
        {lineIndex < lines.length - 1 && '\n'}
      </span>
    )
  })

  return <div className={styles.content}>{formattedContent}</div>
}
