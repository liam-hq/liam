'use client'

import { MessagesSquare } from '@liam-hq/ui'
import Link from 'next/link'
import { type FC, useEffect, useState } from 'react'
import { urlgen } from '../../libs/routes'
import { formatDate } from '../../libs/utils'
import styles from './SessionItem.module.css'
import {
  type SessionStatus,
  SessionStatusIndicator,
} from './SessionStatusIndicator'
import type { ProjectSession } from './services/fetchProjectSessions'

type Props = {
  session: ProjectSession
}

const getWorkflowInProgress = (designSessionId: string): boolean => {
  if (typeof window === 'undefined') return false
  const key = `liam:workflow:${designSessionId}`
  const value = sessionStorage.getItem(key)
  return value === 'in_progress'
}

const determineSessionStatus = (isWorkflowRunning: boolean): SessionStatus => {
  if (isWorkflowRunning) {
    return 'running'
  }

  return 'idle'
}

export const SessionItemClient: FC<Props> = ({ session }) => {
  const [status, setStatus] = useState<SessionStatus>(() =>
    determineSessionStatus(getWorkflowInProgress(session.id)),
  )

  useEffect(() => {
    const checkStatus = () => {
      const isRunning = getWorkflowInProgress(session.id)
      setStatus(determineSessionStatus(isRunning))
    }

    const interval = setInterval(checkStatus, 1000)

    return () => clearInterval(interval)
  }, [session])

  return (
    <Link
      href={urlgen('design_sessions/[id]', { id: session.id })}
      className={styles.sessionItem}
    >
      <SessionStatusIndicator status={status} />
      <div className={styles.iconContainer}>
        <MessagesSquare size={20} />
      </div>
      <div className={styles.content}>
        <h4 className={styles.sessionName}>{session.name}</h4>
        <p className={styles.sessionDate}>
          Created {formatDate(session.created_at)}
        </p>
      </div>
      <div className={styles.arrow}>→</div>
    </Link>
  )
}
