import type { FC } from 'react'
import styles from './LogMessage.module.css'

type LogMessageProps = {
  content: string
}

export const LogMessage: FC<LogMessageProps> = ({ content }) => {
  return <div className={styles.content}>{content}</div>
}
