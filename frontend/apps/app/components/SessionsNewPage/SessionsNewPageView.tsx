import { SessionFormContainer } from '../../features/sessions/components/SessionFormContainer'
import { SessionItem } from '../ProjectSessionsPage/SessionItem'
import styles from './SessionsNewPage.module.css'

type Project = {
  id: string
  name: string
}

type Session = {
  id: string
  name: string
  created_at: string
  project_id: string | null
}

type Props = {
  projects: Project[]
  recentSessions: Session[]
}

export const SessionsNewPageView = ({ projects, recentSessions }: Props) => {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>
          What can I help you <br />
          Database Design?
        </h1>
        <SessionFormContainer projects={projects} />

        {recentSessions.length > 0 && (
          <div className={styles.recentsSection}>
            <h2 className={styles.recentsTitle}>Recent Sessions</h2>
            <div className={styles.sessionsList}>
              {recentSessions.map((session) => (
                <SessionItem key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
