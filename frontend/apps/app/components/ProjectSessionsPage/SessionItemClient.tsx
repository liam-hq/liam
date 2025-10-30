'use client'

import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import { MessagesSquare } from '@liam-hq/ui'
import Link from 'next/link'
import { type FC, useEffect, useState } from 'react'
import { createClient as createSupabaseClient } from '../../libs/db/client'
import { urlgen } from '../../libs/routes'
import type { LatestSessionRun } from '../../libs/runs/fetchLatestSessionRuns'
import { formatDate } from '../../libs/utils'
import styles from './SessionItemClient.module.css'
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

const isLatestSessionRun = (value: unknown): value is LatestSessionRun => {
  if (!isRecord(value)) {
    return false
  }

  const status = value['latest_status']
  const latestRunId = value['run_id']

  return (
    typeof value['design_session_id'] === 'string' &&
    (typeof latestRunId === 'string' || latestRunId === null) &&
    (status === 'running' || status === 'completed' || status === 'error')
  )
}

export const SessionItemClient: FC<Props> = ({ session }) => {
  const [status, setStatus] = useState<SessionStatus>(
    mapDbStatusToUi(session.status),
  )

  useEffect(() => {
    setStatus(mapDbStatusToUi(session.status))
  }, [session.status])

  useEffect(() => {
    const supabase = createSupabaseClient()
    const knownRunIds = new Set<string>()
    if (session.run_id) {
      knownRunIds.add(session.run_id)
    }

    const getRecord = (value: unknown) => (isRecord(value) ? value : null)

    const getStringField = (
      record: Record<string, unknown>,
      key: string,
    ): string | null => {
      const fieldValue = record[key]
      return typeof fieldValue === 'string' ? fieldValue : null
    }

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <fixme>
    const refreshStatus = async () => {
      const responseResult = await fromAsyncThrowable(() =>
        fetch('/api/recents/statuses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionIds: [session.id] }),
        }),
      )()

      if (responseResult.isErr()) {
        console.error(
          'Failed to refresh session status via API:',
          responseResult.error,
        )
        return
      }

      const response = responseResult.value

      if (!response.ok) {
        const bodyResult = await fromAsyncThrowable(() => response.text())()
        if (bodyResult.isErr()) {
          console.error(
            `Failed to refresh session status via API (status ${response.status}): unable to read error body`,
            bodyResult.error,
          )
        } else {
          console.error(
            `Failed to refresh session status via API (status ${response.status}):`,
            bodyResult.value,
          )
        }
        return
      }

      const payloadResult = await fromAsyncThrowable(
        (): Promise<unknown> => response.json(),
      )()

      if (payloadResult.isErr()) {
        console.error(
          'Failed to parse session status response:',
          payloadResult.error,
        )
        return
      }

      const payload = payloadResult.value
      if (!Array.isArray(payload)) {
        console.error('Session status API response was not an array')
        return
      }

      const row = payload.find(isLatestSessionRun)
      if (!row) {
        return
      }

      if (typeof row.run_id === 'string') {
        knownRunIds.add(row.run_id)
      }

      setStatus(mapDbStatusToUi(row.latest_status))
    }

    const resolveSessionMatch = async (runId: string) => {
      if (knownRunIds.has(runId)) {
        return true
      }

      const { data, error } = await supabase
        .from('runs')
        .select('design_session_id')
        .eq('id', runId)
        .maybeSingle()

      if (error) {
        console.error('Error resolving run session mapping:', error)
        return false
      }

      const designSessionId =
        typeof data?.design_session_id === 'string'
          ? data.design_session_id
          : null

      if (designSessionId === session.id && runId) {
        knownRunIds.add(runId)
        return true
      }

      return false
    }

    const handleRunEvent = async (payload: unknown) => {
      const payloadRecord = isRecord(payload) ? payload : null
      const newRow = getRecord(payloadRecord ? payloadRecord['new'] : null)
      if (!newRow) {
        return
      }

      const runId = getStringField(newRow, 'run_id')
      if (!runId) {
        return
      }

      const matchesSession = await resolveSessionMatch(runId)
      if (!matchesSession) {
        return
      }

      await refreshStatus()
    }

    const eventsChannel = supabase
      .channel(`run_events_session_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'run_events',
          filter: `organization_id=eq.${session.organization_id}`,
        },
        async (payload) => {
          // Treat realtime as an invalidation signal and re-read the API-backed
          // session status for this design session.
          await handleRunEvent(payload)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(eventsChannel)
    }
  }, [session.id, session.run_id, session.organization_id])

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
