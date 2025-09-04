import { redirect } from 'next/navigation'
import type { FC } from 'react'
import { getOrganizationId } from '../../features/organizations/services/getOrganizationId'
import { SessionFormContainer } from '../../features/sessions/components/SessionFormContainer'
import { urlgen } from '../../libs/routes'
import { getProjects } from '../CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import { fetchRecentSessions } from '../CommonLayout/GlobalNav/RecentsSection/fetchRecentSessions'
import { SessionItem } from '../ProjectSessionsPage/SessionItem'
import styles from './SessionsNewPage.module.css'

export const SessionsNewPage: FC = async () => {
  const organizationIdResult = await getOrganizationId()
  if (organizationIdResult.isErr()) {
    console.error('Failed to get organization ID:', organizationIdResult.error)
    redirect(urlgen('login'))
  }

  const organizationId = organizationIdResult.value
  const projectsResponse = await getProjects(organizationId)
  const projects = projectsResponse.data || []

  const recentSessions = await fetchRecentSessions(10)

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
