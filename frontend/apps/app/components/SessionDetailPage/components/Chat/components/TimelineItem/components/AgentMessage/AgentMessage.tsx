'use client'

import type { Database } from '@liam-hq/db'
import clsx from 'clsx'
import type { FC, ReactNode } from 'react'
import { MarkdownContent } from '@/components/MarkdownContent'
import { CopyButton } from '@/components/SessionDetailPage/components/Output/components/shared/CopyButton'
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
  state: AgentMessageState
  /**
   * The message content
   */
  message: string
  /**
   * The timestamp to display
   */
  // eslint-disable-next-line no-restricted-syntax
  time?: string
  assistantRole: Database['public']['Enums']['assistant_role_enum']
  /**
   * Optional children to render below the message
   */
  // eslint-disable-next-line no-restricted-syntax
  children?: ReactNode
  /**
   * Whether to show avatar and name (false for consecutive messages from the same agent)
   */
  showHeader: boolean
}

export const AgentMessage: FC<AgentMessageProps> = ({
  state = 'default',
  message = '',
  assistantRole,
  children,
  showHeader = true,
}) => {
  const isGenerating = state === 'generating'
  const { avatar, name } = getAgentInfo(assistantRole)

  return (
    <div className={styles.container}>
      {showHeader && (
        <div className={styles.avatarContainer}>
          {avatar}
          <span className={styles.agentName}>{name}</span>
        </div>
      )}
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
            {message && (
              <div className={styles.copyButtonWrapper}>
                <CopyButton
                  textToCopy={message}
                  tooltipLabel="Copy message"
                  size="sm"
                />
              </div>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
