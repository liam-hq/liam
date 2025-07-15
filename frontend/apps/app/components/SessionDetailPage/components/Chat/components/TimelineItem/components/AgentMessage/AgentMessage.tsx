'use client'

import clsx from 'clsx'
import type { FC, ReactNode } from 'react'
import { MarkdownContent } from '@/components/MarkdownContent'
import styles from './AgentMessage.module.css'
import { DBAgent } from './components/AgentAvatar/DbAgent'

type AgentMessageState = 'default' | 'generating'

type AgentMessageProps = {
  /**
   * The state of the message
   */
  state?: AgentMessageState
  /**
   * The message content
   */
  message?: string
  /**
   * The timestamp to display
   */
  time?: string
  /**
   * The name of the agent to display
   */
  agentName?: string
  /**
   * Custom avatar component
   */
  avatar?: ReactNode
  /**
   * Optional children to render below the message
   */
  children?: ReactNode
}

export const AgentMessage: FC<AgentMessageProps> = ({
  state = 'default',
  message = '',
  agentName,
  avatar,
  children,
}) => {
  const isGenerating = state === 'generating'

  return (
    <div className={styles.container}>
      <div className={styles.avatarContainer}>
        {avatar || <DBAgent />}
        <span className={styles.agentName}>{agentName || 'DB Agent'}</span>
      </div>
      <div className={styles.contentContainer}>
        {isGenerating &&
        (!message || (typeof message === 'string' && message.trim() === '')) ? (
          <div
            className={clsx(styles.messageWrapper, styles.generatingContainer)}
          >
            <span className={styles.generatingText}>Generating</span>
          </div>
        ) : (
          <div
            className={clsx(
              styles.messageWrapper,
              isGenerating ? styles.generatingContainer : '',
            )}
          >
            <div className={styles.messageContent}>
              <span className={styles.messageText}>
                <MarkdownContent content={message} />
              </span>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
