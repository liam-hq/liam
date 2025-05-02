'use client'

import type { FC } from 'react'
import styles from './ChatMessage.module.css'
import { ERDMessageRenderer } from './ERDMessageRenderer'

export interface ChatMessageProps {
  content: string
  isUser: boolean
  timestamp?: Date
}

export const ChatMessage: FC<ChatMessageProps> = ({
  content,
  isUser,
  timestamp,
}) => {
  // Only format and display timestamp if it exists
  const formattedTime = timestamp
    ? timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div
      className={`${styles.messageContainer} ${
        isUser ? styles.userMessage : styles.botMessage
      }`}
    >
      <div className={styles.messageContent}>
        {isUser ? (
          <div className={styles.messageText}>{content}</div>
        ) : (
          <div className={styles.messageText}>
            <ERDMessageRenderer content={content} />
          </div>
        )}
        {formattedTime && (
          <div className={styles.messageTime}>{formattedTime}</div>
        )}
      </div>
    </div>
  )
}
