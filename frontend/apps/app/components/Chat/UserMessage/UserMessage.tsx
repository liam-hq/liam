'use client'

import { Avatar, AvatarWithImage } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './UserMessage.module.css'

export interface UserMessageProps {
  content: string
  initial?: string
  avatarSrc?: string
  avatarAlt?: string
  timestamp?: Date
}

export const UserMessage: FC<UserMessageProps> = ({
  content,
  initial = '',
  avatarSrc,
  avatarAlt = 'User avatar',
  timestamp,
}) => {
  // Format timestamp if it exists
  const formattedTime = timestamp
    ? timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className={styles.container}>
      <div className={styles.messageWrapper}>
        <div className={styles.messageContent}>
          <div className={styles.messageText}>{content}</div>
          {formattedTime && (
            <div className={styles.messageTime}>{formattedTime}</div>
          )}
        </div>
        <div className={styles.avatarContainer}>
          {avatarSrc ? (
            <AvatarWithImage src={avatarSrc} alt={avatarAlt} size="sm" />
          ) : (
            <Avatar initial={initial} size="sm" user="you" />
          )}
        </div>
      </div>
    </div>
  )
}
