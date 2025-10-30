import type { FC } from 'react'
import { fetchRecentSessions } from '../../CommonLayout/GlobalNav/RecentsSection/fetchRecentSessions'
import { SessionItem } from '../../ProjectSessionsPage/SessionItem'
import { Fallback } from './Fallback'
import styles from './RecentSessionsSection.module.css'

type Props = {
  organizationId: string
}

export const RecentSessionsSection: FC<Props> = async ({ organizationId }) => {
  const recentSessions = await fetchRecentSessions(organizationId)

  if (recentSessions.length === 0) return null

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Recent Sessions</h2>
      <div className={styles.list}>
        {recentSessions.map((session) => (
          <SessionItem key={session.id} session={session} />
        ))}
      </div>
    </div>
  )
}

export { Fallback as RecentSessionsSectionFallback }
