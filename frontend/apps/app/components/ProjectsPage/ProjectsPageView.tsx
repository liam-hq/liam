import { urlgen } from '../../libs/routes'
import { EmptyProjectsState } from './components/EmptyProjectsState'
import { ProjectsListView } from './components/ProjectsListView'
import styles from './ProjectsPage.module.css'
import type { ProjectWithLastCommit } from './types'

type Organization = {
  id: string
  name: string
}

type Props = {
  currentOrganization: Organization
  projects: ProjectWithLastCommit[] | null
}

export const ProjectsPageView = ({ currentOrganization, projects }: Props) => {
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
          <ProjectsListView
            initialProjects={projects}
            organizationId={currentOrganization.id}
          />
        )}
      </div>
    </div>
  )
}
