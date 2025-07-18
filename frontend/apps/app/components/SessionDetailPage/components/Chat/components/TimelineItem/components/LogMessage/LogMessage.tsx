import clsx from 'clsx'
import type { FC, ReactNode } from 'react'
import styles from './LogMessage.module.css'

type LogMessageProps = {
  content: string
  isLast?: boolean
  status?: 'success' | 'error' | 'in-progress' | 'pending'
}

const generateLineKey = (lineIndex: number, line: string): string => {
  const sanitizedLine =
    line.trim().substring(0, 30).replace(/\s+/g, '-') || 'empty'
  return `line-${lineIndex}-${sanitizedLine}`
}

const processLineParts = (line: string, lineIndex: number): ReactNode[] => {
  return line.split(/(\s*✓\s*|\s*✗\s*|⏳)/).map((part, partIndex) => {
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
}

const renderFormattedLine = (
  line: string,
  lineIndex: number,
  parts: ReactNode[],
  lines: string[],
): ReactNode => {
  const isPending = line.trim().startsWith('•')
  const isCurrentTask = line.includes('⏳')
  const hasCheckOrCross = line.includes('✓') || line.includes('✗')
  const key = generateLineKey(lineIndex, line)
  const lineBreak = lineIndex < lines.length - 1 ? '\n' : null

  if (hasCheckOrCross || isCurrentTask) {
    return (
      <span
        key={key}
        className={clsx(
          styles.lineText,
          isPending ? styles.pendingTask : '',
          isCurrentTask ? styles.currentTask : '',
        )}
      >
        {parts}
        {lineBreak}
      </span>
    )
  }

  return (
    <span key={key} className={isPending ? styles.pendingTask : undefined}>
      {parts}
      {lineBreak}
    </span>
  )
}

export const LogMessage: FC<LogMessageProps> = ({ content }) => {
  const lines = content.split('\n')

  const formattedContent = lines.map((line, lineIndex) => {
    const parts = processLineParts(line, lineIndex)
    return renderFormattedLine(line, lineIndex, parts, lines)
  })

  return <div className={styles.content}>{formattedContent}</div>
}
