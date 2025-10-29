'use client'

import { MessagesSquare } from '@liam-hq/ui'
import Link from 'next/link'
import { type FC, useEffect, useState } from 'react'
import { createClient as createSupabaseClient } from '../../libs/db/client'
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

const mapDbStatusToUi = (status: string | undefined): SessionStatus => {
  if (status === 'error') {
    return 'error'
  }

  if (status === 'completed' || status === 'success') {
    return 'completed'
  }

  if (status === 'pending') {
    return 'running'
  }

  return 'running'
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const SessionItemClient: FC<Props> = ({ session }) => {
  const [status, setStatus] = useState<SessionStatus>(
    mapDbStatusToUi(session.status),
  )

  useEffect(() => {
    setStatus(mapDbStatusToUi(session.status))
  }, [session.status])

  useEffect(() => {
    const supabase = createSupabaseClient()
    const runStatuses = new Map<string, SessionStatus>()

    if (session.latest_run_id) {
      runStatuses.set(session.latest_run_id, mapDbStatusToUi(session.status))
    }

    const getRecord = (value: unknown) => (isRecord(value) ? value : null)

    const getStringField = (
      record: Record<string, unknown>,
      key: string,
    ): string | null => {
      const value = record[key]
      return typeof value === 'string' ? value : null
    }

    const deriveAggregatedStatus = () => {
      if (runStatuses.size === 0) {
        return mapDbStatusToUi(session.status)
      }

      const statuses = Array.from(runStatuses.values())
      if (statuses.some((value) => value === 'error')) {
        return 'error' as const
      }

      if (statuses.some((value) => value === 'running')) {
        return 'running' as const
      }

      return 'completed' as const
    }

    const getUpdatedRun = (payload: unknown) => {
      const payloadRecord = isRecord(payload) ? payload : null
      const newRow = getRecord(payloadRecord ? payloadRecord['new'] : null)
      if (!newRow) {
        return null
      }

      const runId = getStringField(newRow, 'id')
      const designSessionId = getStringField(newRow, 'design_session_id')
      if (!runId || designSessionId !== session.id) {
        return null
      }

      return { runId, statusValue: getStringField(newRow, 'status') }
    }

    const handleRunInsert = (payload: unknown) => {
      const updatedRun = getUpdatedRun(payload)
      if (!updatedRun) {
        return
      }

      runStatuses.set(updatedRun.runId, 'running')
      setStatus(deriveAggregatedStatus())
    }

    const handleRunUpdate = (payload: unknown) => {
      const updatedRun = getUpdatedRun(payload)
      if (!updatedRun) {
        return
      }

      const { runId, statusValue } = updatedRun
      if (statusValue) {
        runStatuses.set(runId, mapDbStatusToUi(statusValue))
      }

      setStatus(deriveAggregatedStatus())
    }

    const runsChannel = supabase
      .channel(`runs_session_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'runs',
          filter: `design_session_id=eq.${session.id}`,
        },
        (payload) => handleRunInsert(payload),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'runs',
          filter: `design_session_id=eq.${session.id}`,
        },
        (payload) => handleRunUpdate(payload),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(runsChannel)
    }
  }, [session.id, session.latest_run_id, session.status])

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
