'use client'

import { UserMessage } from '@/components/Chat/UserMessage'
import type { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './ChatMessage.module.css'

export interface ChatMessageProps {
  content: string
  isUser: boolean
  timestamp?: Date
  avatarSrc?: string
  avatarAlt?: string
  initial?: string
}

export const ChatMessage: FC<ChatMessageProps> = ({
  content,
  isUser,
  timestamp,
  avatarSrc,
  avatarAlt,
  initial,
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
      {isUser ? (
        <UserMessage
          content={content}
          timestamp={timestamp}
          avatarSrc={avatarSrc}
          avatarAlt={avatarAlt}
          initial={initial}
        />
      ) : (
        <div className={styles.messageContent}>
          <div className={styles.messageText}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
          {formattedTime && (
            <div className={styles.messageTime}>{formattedTime}</div>
          )}
        </div>
      )}
    </div>
  )
}
