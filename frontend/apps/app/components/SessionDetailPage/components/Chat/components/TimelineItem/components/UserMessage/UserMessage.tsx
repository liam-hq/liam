'use client'

import { Avatar, AvatarWithImage, Check, Copy, IconButton } from '@liam-hq/ui'
import { type FC, useState } from 'react'
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
  timestamp,
  userName,
}) => {
  const [isCopied, setIsCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const userInitial = userName
    ? userName
        .split(' ')
        .filter((name) => name.trim().length > 0) // Filter out empty or whitespace-only parts
        .map((name) => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U' // Fallback to 'U' if no valid initials
    : 'U'

  // Format timestamp if it exists - use explicit locale and timezone for consistency
  const formattedTime = timestamp
    ? timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      })
    : null

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  return (
    <div
      className={styles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.avatarContainer}>
        {avatarSrc ? (
          <AvatarWithImage src={avatarSrc} alt={avatarAlt} size="sm" />
        ) : (
          <Avatar initial={userInitial} size="sm" user="you" />
        )}
        <span className={styles.userName}>{userName || 'User Name'}</span>
        {formattedTime && (
          <span className={styles.messageTime}>{formattedTime}</span>
        )}
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.messageWrapper}>
          <div className={styles.messageContent}>
            <div className={styles.messageText}>
              <MarkdownContent content={content} />
            </div>
          </div>
          {isHovered && (
            <div className={styles.copyButtonWrapper}>
              <IconButton
                icon={isCopied ? <Check size={16} /> : <Copy size={16} />}
                onClick={handleCopyMessage}
                tooltipContent={isCopied ? 'Copied!' : 'Copy message'}
                size="sm"
                variant="hoverBackground"
                aria-label={isCopied ? 'Message copied' : 'Copy message'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
