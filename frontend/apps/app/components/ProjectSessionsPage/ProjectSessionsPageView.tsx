import { MessagesSquare } from '@liam-hq/ui'
import { SessionFormContainer } from '../../features/sessions/components/SessionFormContainer'
import styles from './ProjectSessionsPage.module.css'
import { SessionItem } from './SessionItem'
import type { ProjectSession } from './services/fetchProjectSessions'

type Project = {
  id: string
  name: string
}

type Props = {
  projectId: string
  sessions: ProjectSession[]
  projects: Project[]
}

export const ProjectSessionsPageView = ({
  projectId,
  sessions,
  projects,
}: Props) => {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>
          Create a new session
          <br />
          for this project
        </h1>
        <SessionFormContainer
          projects={projects}
          defaultProjectId={projectId}
        />

        {sessions.length > 0 && (
          <div className={styles.recentsSection}>
            <h2 className={styles.recentsTitle}>Session History</h2>
            <div className={styles.sessionsList}>
              {sessions.map((session) => (
                <SessionItem key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}

        {sessions.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <MessagesSquare size={48} />
            </div>
            <h3 className={styles.emptyTitle}>No sessions yet</h3>
            <p className={styles.emptyDescription}>
              Start a new design session to explore ideas and generate artifacts
              for this project.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
