'use client'

import { MessagesSquare } from '@liam-hq/ui'
import Link from 'next/link'
import type { FC } from 'react'
import { useStreamingContext } from '../../contexts/StreamingContext'
import { urlgen } from '../../libs/routes'
import { formatDate } from '../../libs/utils'
import styles from './SessionItem.module.css'
import type { ProjectSession } from './services/fetchProjectSessions'

type Props = {
  session: ProjectSession
}

export const SessionItemClient: FC<Props> = ({ session }) => {
  const { getSession } = useStreamingContext()
  const streamingSession = getSession(session.id)
  const isStreaming = streamingSession?.isStreaming ?? false

  return (
    <Link
      href={urlgen('design_sessions/[id]', { id: session.id })}
      className={styles.sessionItem}
      data-streaming={isStreaming}
    >
      <div className={styles.iconContainer}>
        <MessagesSquare size={20} />
      </div>
      <div className={styles.content}>
        <h4 className={styles.sessionName}>
          {session.name}
          {isStreaming && (
            <span className={styles.streamingBadge}>In Progress</span>
          )}
        </h4>
        <p className={styles.sessionDate}>
          Created {formatDate(session.created_at)}
        </p>
      </div>
      <div className={styles.arrow}>→</div>
    </Link>
  )
}
