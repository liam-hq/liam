'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { type FC, useEffect, useState } from 'react'
import { urlgen } from '../../../../libs/routes'
import { formatDateShort } from '../../../../libs/utils'
import {
  type SessionStatus,
  SessionStatusIndicator,
} from '../../../ProjectSessionsPage/SessionStatusIndicator'
import styles from './RecentsSectionClient.module.css'
import type { RecentSession } from './types'

type Props = {
  session: RecentSession
  isActive: boolean
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

export const RecentSessionItem: FC<Props> = ({ session, isActive }) => {
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
  }, [session.id])

  const sessionUrl = urlgen('design_sessions/[id]', {
    id: session.id,
  })
  const sessionDate = formatDateShort(session.created_at)

  return (
    <Link
      href={sessionUrl}
      className={clsx(styles.sessionItem, isActive && styles.sessionItemActive)}
      aria-label={`${session.name}, created on ${sessionDate}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <SessionStatusIndicator status={status} />
      <div className={styles.sessionContent}>
        <span className={styles.sessionName}>{session.name}</span>
        <span className={styles.sessionDate} aria-hidden="true">
          {sessionDate}
        </span>
      </div>
    </Link>
  )
}
