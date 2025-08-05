'use client'

import { Avatar, AvatarWithImage } from '@liam-hq/ui'
import type { FC } from 'react'
import { MarkdownContent } from '@/components/MarkdownContent'
import styles from './UserMessage.module.css'

type UserMessageProps = {
  content: string
  avatarSrc?: string
  avatarAlt?: string
  timestamp?: Date
  userName?: string
}

export const UserMessage: FC<UserMessageProps> = ({
  content,
  avatarSrc,
  avatarAlt = 'User avatar',
  userName,
}) => {
  const userInitial = userName
    ? userName
        .split(' ')
        .filter((name) => name.trim().length > 0) // Filter out empty or whitespace-only parts
        .map((name) => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U' // Fallback to 'U' if no valid initials
    : 'U'

  return (
    <div className={styles.container}>
      <div className={styles.avatarContainer}>
        {avatarSrc ? (
          <AvatarWithImage src={avatarSrc} alt={avatarAlt} size="sm" />
        ) : (
          <Avatar initial={userInitial} size="sm" user="you" />
        )}
        <span className={styles.userName}>{userName || 'User Name'}</span>
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.messageWrapper}>
          <div className={styles.messageContent}>
            <div className={styles.messageText}>
              <MarkdownContent content={content} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
