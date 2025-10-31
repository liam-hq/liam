'use client'

import clsx from 'clsx'
import Link from 'next/link'
import type { FC } from 'react'
import { urlgen } from '../../../../libs/routes'
import { formatDateShort } from '../../../../libs/utils'
import { SessionStatusIndicator } from '../../../ProjectSessionsPage/SessionStatusIndicator'
import styles from './RecentSessionItem.module.css'
import type { RecentSession } from './types'

type Props = {
  session: RecentSession
  isActive: boolean
  showOwner?: boolean
}

export const RecentSessionItem: FC<Props> = ({
  session,
  isActive,
  showOwner = false,
}) => {
  const sessionUrl = urlgen('design_sessions/[id]', {
    id: session.id,
  })
  const sessionDate = formatDateShort(session.created_at)
  const ownerName = session.created_by_user?.name || 'Unknown'
  const ariaLabel = `${session.name}, created on ${sessionDate}${
    showOwner ? ` by ${ownerName}` : ''
  }`

  return (
    <Link
      href={sessionUrl}
      className={clsx(styles.sessionItem, isActive && styles.sessionItemActive)}
      aria-label={ariaLabel}
      aria-current={isActive ? 'page' : undefined}
    >
      <SessionStatusIndicator status={session.status} />
      <div className={styles.sessionInfo}>
        <span className={styles.sessionName}>{session.name}</span>
        {showOwner && <span className={styles.sessionOwner}>{ownerName}</span>}
        <span className={styles.sessionDate} aria-hidden="true">
          {sessionDate}
        </span>
      </div>
    </Link>
  )
}
