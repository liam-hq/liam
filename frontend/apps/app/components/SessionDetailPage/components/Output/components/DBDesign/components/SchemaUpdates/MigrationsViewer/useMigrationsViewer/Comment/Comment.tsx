import { Button } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './Comment.module.css'

type SeverityLevel = 'High' | 'Medium' | 'Low'

type Props = {
  level: SeverityLevel
  comment: string
  onQuickFix?: (comment: string) => void
}

const severityClassMap: Record<SeverityLevel, string> = {
  High: styles.high,
  Medium: styles.medium,
  Low: styles.low,
}

export const Comment: FC<Props> = ({ level, comment, onQuickFix }) => {
  const handleQuickFix = () => {
    onQuickFix?.(comment)
  }
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={`${styles.badge} ${severityClassMap[level]}`}>
            <span>{level}</span>
          </div>
          <p className={styles.text}>{comment}</p>
          {onQuickFix && (
            <Button
              variant="ghost-secondary"
              size="sm"
              onClick={handleQuickFix}
            >
              Quick Fix...
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
