'use client'

import { Avatar, Check, Copy, IconButton } from '@liam-hq/ui'
import { type FC, useState } from 'react'
import { MarkdownContent } from '@/components/MarkdownContent'
import styles from './HumanMessage.module.css'

type Props = {
  content: string
  timestamp?: Date
}

export const HumanMessage: FC<Props> = ({ content, timestamp }) => {
  const [isCopied, setIsCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

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

  const formattedTime = timestamp
    ? timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      })
    : null

  return (
    <div
      className={styles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.avatarContainer}>
        <Avatar initial="U" size="sm" user="you" />
        <span className={styles.userName}>User</span>
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
