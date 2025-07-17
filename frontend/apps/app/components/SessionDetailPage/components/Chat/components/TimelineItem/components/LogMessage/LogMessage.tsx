import clsx from 'clsx'
import type { FC } from 'react'
import styles from './LogMessage.module.css'
import { enhanceMessage } from './utils/messageEnhancer'

type LogMessageProps = {
  content: string
  enhanceWithEmojis?: boolean
}

export const LogMessage: FC<LogMessageProps> = ({
  content,
  enhanceWithEmojis = true,
}) => {
  // Enhance content with emojis and status indicators if enabled
  const processedContent = enhanceWithEmojis ? enhanceMessage(content) : content

  // Split content by lines to handle each task separately
  const lines = processedContent.split('\n')

  const formattedContent = lines.map((line, lineIndex) => {
    // Check if this line is a pending task (starts with •)
    const isPending = line.trim().startsWith('•')
    // Check if this line is currently running (starts with ⏳)
    const isCurrentTask = line.includes('⏳')
    // Check if this line has a checkmark or crossmark
    const hasCheckOrCross = line.includes('✓') || line.includes('✗')

    // Replace ✓, ✗, ⏳, and style • lines
    const parts = line.split(/(\s*✓\s*|\s*✗\s*|⏳)/).map((part, partIndex) => {
      const keyBase = `${lineIndex}-${part.trim()}-${partIndex}`
      if (part.includes('✓')) {
        return (
          <span key={`check-${keyBase}`} className={styles.checkmark}>
            {part}
          </span>
        )
      }
      if (part.includes('✗')) {
        return (
          <span key={`cross-${keyBase}`} className={styles.crossmark}>
            {part}
          </span>
        )
      }
      if (part === '⏳') {
        return <span key={`hourglass-${keyBase}`}>{part}</span>
      }
      return part
    })

    if (hasCheckOrCross || isCurrentTask) {
      return (
        <span
          key={`line-${lineIndex}-${line.trim().substring(0, 30).replace(/\s+/g, '-') || 'empty'}`}
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
        key={`line-${lineIndex}-${line.trim().substring(0, 30).replace(/\s+/g, '-') || 'empty'}`}
        className={isPending ? styles.pendingTask : undefined}
      >
        {parts}
        {lineIndex < lines.length - 1 && '\n'}
      </span>
    )
  })

  return <div className={styles.content}>{formattedContent}</div>
}
