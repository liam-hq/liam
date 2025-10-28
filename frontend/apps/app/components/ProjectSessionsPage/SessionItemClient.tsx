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

const mapDbStatusToUi = (
  status: ProjectSession['status'] | undefined,
): SessionStatus => {
  if (status === 'running') {
    return 'running'
  }

  if (status === 'error') {
    return 'error'
  }

  return 'completed'
}

export const SessionItemClient: FC<Props> = ({ session }) => {
  const [status, setStatus] = useState<SessionStatus>(
    mapDbStatusToUi(session.status),
  )

  useEffect(() => {
    const supabase = createSupabaseClient()
    const channel = supabase
      .channel(`design_sessions_status_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'design_sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          if (!payload.new || typeof payload.new !== 'object') {
            return
          }

          const rawStatus = Reflect.get(payload.new, 'status')
          const next =
            rawStatus === 'running' ||
            rawStatus === 'error' ||
            rawStatus === 'completed'
              ? rawStatus
              : undefined

          setStatus(mapDbStatusToUi(next))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session.id])

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
