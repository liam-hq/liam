import { notFound } from 'next/navigation'
import { urlgen } from '../../libs/routes'
import { NoProjects } from './components/NoProjects'
import { ServerProjectsDataProvider } from './components/ServerProjectsDataProvider'
import styles from './ProjectsPage.module.css'
import {
  getCurrentOrganization,
  getUserOrganizations,
} from './services/getCurrentOrganization'
import { getProjects } from './services/getProjects'

type Props = {
  organizationId: string
}

export async function ProjectsPage({ organizationId }: Props) {
  const currentOrganization = await getCurrentOrganization(organizationId)

  if (!currentOrganization) {
    console.error('Organization not found')
    notFound()
  }

  await getUserOrganizations() // Fetch for future use
  const projects = await getProjects(currentOrganization.id)

  return (
    <div className={styles.container}>
      <div className={styles.contentContainer}>
        <h1 className={styles.heading}>Projects</h1>
        {projects === null || projects.length === 0 ? (
          <NoProjects
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
