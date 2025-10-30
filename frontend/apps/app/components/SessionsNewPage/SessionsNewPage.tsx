import { redirect } from 'next/navigation'
import { type FC, Suspense } from 'react'
import { getOrganizationId } from '../../features/organizations/services/getOrganizationId'
import { SessionFormContainer } from '../../features/sessions/components/SessionFormContainer'
import { urlgen } from '../../libs/routes'
import { getProjects } from '../CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import {
  RecentSessionsSection,
  RecentSessionsSectionFallback,
} from './RecentSessionsSection'
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

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>
          How can I help you with <br />
          Database Design?
        </h1>
        <SessionFormContainer projects={projects} />

        <Suspense fallback={<RecentSessionsSectionFallback />}>
          <RecentSessionsSection organizationId={organizationId} />
        </Suspense>
      </div>
    </div>
  )
}
