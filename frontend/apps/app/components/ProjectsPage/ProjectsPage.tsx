import { urlgen } from '@/libs/routes'
import styles from './ProjectsPage.module.css'
import { ServerProjectsDataProvider } from './ServerProjectsDataProvider'
import { EmptyProjectsState } from './components/EmptyProjectsState'
import {
  getCurrentOrganization,
  getUserOrganizations,
} from './services/getCurrentOrganization'
import { getProjects } from './services/getProjects'

export async function ProjectsPage({
  organizationId,
}: {
  organizationId: string
}) {
  const currentOrganization = await getCurrentOrganization(organizationId)

  if (!currentOrganization) {
    console.error('Organization not found')
    throw new Error('Organization not found')
  }

  await getUserOrganizations() // Fetch for future use
  const projects = await getProjects(currentOrganization.id)

  return (
    <div className={styles.container}>
      <div className={styles.contentContainer}>
        <h1 className={styles.heading}>Projects</h1>
        {projects === null || projects.length === 0 ? (
          <EmptyProjectsState
            projects={projects}
            createProjectHref={
              currentOrganization
                ? urlgen('projects/new')
                : urlgen('organizations/new')
            }
          />
        ) : (
          <ServerProjectsDataProvider
            projects={projects}
            organizationId={organizationId}
          />
        )}
      </div>
    </div>
  )
}
