import type { FC } from 'react'
import { LogMessage } from '../LogMessage'
import styles from './GroupedLogMessage.module.css'

type GroupedLogMessageProps = {
  messages: string[]
}

export const GroupedLogMessage: FC<GroupedLogMessageProps> = ({ messages }) => {
  return (
    <div className={styles.container}>
      {messages.map((message, index) => (
        <div
          key={`message-${index}-${message.slice(0, 20)}`}
          className={styles.messageItem}
        >
          <LogMessage content={message} />
        </div>
      ))}
    </div>
  )
}
