'use client'

import type { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './ChatMessage.module.css'

interface MessagePart {
  type: string
  text?: string
  details?: Array<{
    type: string
    text?: string
    data?: string
    signature?: string
  }>
  reasoning?: string
}

export interface ChatMessageProps {
  content: string
  isUser: boolean
  timestamp?: Date
  parts?: MessagePart[]
}

export const ChatMessage: FC<ChatMessageProps> = ({
  content,
  isUser,
  timestamp,
  parts,
}) => {
  // Format the timestamp only if it exists
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
          <div className={styles.messageText}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className={styles.messageText}>
            {parts && parts.length > 0 ? (
              <>
                {parts.map((part) => {
                  if (part.type === 'text') {
                    return (
                      <ReactMarkdown
                        key={`text-part-${part.text?.substring(0, 20)}-${Math.random().toString(36).substring(2, 9)}`}
                        remarkPlugins={[remarkGfm]}
                      >
                        {part.text || ''}
                      </ReactMarkdown>
                    )
                  }

                  if (part.type === 'reasoning') {
                    return (
                      <div
                        key={`reasoning-part-${Math.random().toString(36).substring(2, 9)}`}
                        className={styles.reasoning}
                      >
                        {part.details?.map((detail) =>
                          detail.type === 'text' ? (
                            <div
                              key={`detail-text-${detail.text?.substring(0, 10) || ''}-${Math.random().toString(36).substring(2, 9)}`}
                            >
                              {detail.text || ''}
                            </div>
                          ) : (
                            <div
                              key={`detail-redacted-${Math.random().toString(36).substring(2, 9)}`}
                            >
                              &lt;redacted&gt;
                            </div>
                          ),
                        )}
                      </div>
                    )
                  }

                  return null
                })}
              </>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {formattedTime && (
          <div className={styles.messageTime}>{formattedTime}</div>
        )}
      </div>
    </div>
  )
}
