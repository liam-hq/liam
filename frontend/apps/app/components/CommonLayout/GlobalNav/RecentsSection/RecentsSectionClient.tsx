'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { urlgen } from '../../../../libs/routes'
import { formatDateShort } from '../../../../libs/utils'
import itemStyles from '../Item.module.css'
import styles from './RecentsSection.module.css'
import type { RecentSession } from './types'

type RecentsSectionClientProps = {
  sessions: RecentSession[]
}

export const RecentsSectionClient = ({
  sessions,
}: RecentsSectionClientProps) => {
  const pathname = usePathname()

  return (
    <>
      <div className={clsx(itemStyles.item, styles.recentsCollapsed)}>
        <div className={itemStyles.labelArea}>
          <span className={itemStyles.label}>Recents</span>
        </div>
      </div>
      <div className={styles.recentsExpanded}>
        <div className={styles.recentsSection}>
          <div className={styles.recentsHeader}>
            <div className={itemStyles.labelArea}>
              <span className={clsx(itemStyles.label, styles.recentsTitle)}>
                Recents
              </span>
            </div>
          </div>

          {sessions.length > 0 ? (
            <nav className={styles.sessionsList} aria-label="Recent sessions">
              {sessions.map((session) => {
                const sessionUrl = urlgen('design_sessions/[id]', {
                  id: session.id,
                })
                const isActive = pathname === sessionUrl
                const sessionDate = formatDateShort(session.created_at)
                return (
                  <Link
                    key={session.id}
                    href={sessionUrl}
                    className={clsx(
                      styles.sessionItem,
                      isActive && styles.sessionItemActive,
                    )}
                    aria-label={`${session.name}, created on ${sessionDate}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className={styles.sessionName}>{session.name}</span>
                    <span className={styles.sessionDate} aria-hidden="true">
                      {sessionDate}
                    </span>
                  </Link>
                )
              })}
            </nav>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyText}>No recent sessions</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
