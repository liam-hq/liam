'use client'

import type { Database } from '@liam-hq/db'
import clsx from 'clsx'
import type { FC, ReactNode } from 'react'
import { MarkdownContent } from '@/components/MarkdownContent'
import styles from './AgentMessage.module.css'
import { DBAgent, PMAgent, QAAgent } from './components/AgentAvatar'

type AgentMessageState = 'default' | 'generating'

/**
 * Get agent avatar and name from role
 */
const getAgentInfo = (
  role: Database['public']['Enums']['assistant_role_enum'],
) => {
  switch (role) {
    case 'db':
      return { avatar: <DBAgent />, name: 'DB Agent' }
    case 'pm':
      return { avatar: <PMAgent />, name: 'PM Agent' }
    case 'qa':
      return { avatar: <QAAgent />, name: 'QA Agent' }
    default:
      return { avatar: <DBAgent />, name: 'DB Agent' }
  }
}

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
  assistantRole: Database['public']['Enums']['assistant_role_enum']
  /**
   * Optional children to render below the message
   */
  children?: ReactNode
}

export const AgentMessage: FC<AgentMessageProps> = ({
  state = 'default',
  message = '',
  assistantRole,
  children,
}) => {
  const isGenerating = state === 'generating'
  const { avatar, name } = getAgentInfo(assistantRole)

  return (
    <div className={styles.container}>
      <div className={styles.avatarContainer}>
        {avatar}
        <span className={styles.agentName}>{name}</span>
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
