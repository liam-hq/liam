import { urlgen } from '@/libs/routes'
import { MessagesSquare } from '@liam-hq/ui'
import Link from 'next/link'
import type { FC } from 'react'
import styles from './SessionItem.module.css'
import type { ProjectSession } from './services/fetchProjectSessions'

type Props = {
  session: ProjectSession
}

export const SessionItem: FC<Props> = ({ session }) => {
  return (
    <Link
      href={urlgen('design_sessions/[id]', { id: session.id })}
      className={styles.sessionItem}
    >
      <div className={styles.iconContainer}>
        <MessagesSquare size={20} />
      </div>
      <div className={styles.content}>
        <h4 className={styles.sessionName}>{session.name}</h4>
        <p className={styles.sessionDate}>
          Created {new Date(session.created_at).toLocaleDateString()}
        </p>
      </div>
      <div className={styles.arrow}>→</div>
    </Link>
  )
}
