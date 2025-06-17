import type { FC } from 'react'
import styles from './Comment.module.css'
import { QAAgentIcon } from './QAAgentIcon'

type SeverityLevel = 'High' | 'Medium' | 'Low'

type Props = {
  level: SeverityLevel
  comment: string
}

const severityClassMap: Record<SeverityLevel, string> = {
  High: styles.high,
  Medium: styles.medium,
  Low: styles.low,
}

export const Comment: FC<Props> = ({ level, comment }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <QAAgentIcon />
        <div className={styles.content}>
          <div className={styles.head}>
            <span className={styles.commenter}>QA Agent</span>
            <div className={`${styles.badge} ${severityClassMap[level]}`}>
              <span>{level}</span>
            </div>
          </div>
          <p className={styles.text}>{comment}</p>
        </div>
      </div>
    </div>
  )
}
