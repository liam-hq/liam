'use server'

import type { Tables } from '@liam-hq/db/supabase/database.types'
import { ProjectsListView } from './components/ProjectsListView'
import { fetchLastCommitData } from './services/fetchLastCommitData'
import type { ProjectWithLastCommit } from './types'

interface ServerProjectsDataProviderProps {
  projects: Tables<'projects'>[] | null
  organizationId?: string
}

/**
 * Server component that enhances projects with commit data before passing to the client
 * This allows us to fetch commit data on the server for better performance
 */
export async function ServerProjectsDataProvider({
  projects,
  organizationId,
}: ServerProjectsDataProviderProps) {
  if (!projects || projects.length === 0) {
    // Pass null/empty projects directly to client component
    return (
      <ProjectsListView
        initialProjects={projects}
        organizationId={organizationId}
      />
    )
  }

  try {
    // Fetch commit data for all projects in parallel
    const projectsWithDates = await Promise.all(
      projects.map(async (project) => {
        // Create a new object with the ProjectWithLastCommit shape
        const projectWithLastCommit: ProjectWithLastCommit = {
          ...project,
          lastCommitDate: undefined,
        }

        const repository =
          projectWithLastCommit.project_repository_mappings?.[0]?.repository

        if (repository) {
          try {
            const commitData = await fetchLastCommitData(
              repository.github_installation_identifier,
              repository.owner,
              repository.name,
            )

            if (commitData?.date) {
              return {
                ...projectWithLastCommit,
                lastCommitDate: commitData.date,
              }
            }
          } catch (error) {
            console.error(
              'Error fetching commit data for project:',
              project.id,
              error,
            )
          }
        }

        // Use project update/creation date as fallback
        return {
          ...projectWithLastCommit,
          lastCommitDate: project.updated_at || project.created_at,
        }
      }),
    )

    // Return client component with enhanced project data
    return (
      <ProjectsListView
        initialProjects={projectsWithDates}
        organizationId={organizationId}
      />
    )
  } catch (error) {
    console.error('Error processing projects with commit data:', error)
    // Fallback to original projects if there's an error
    return (
      <ProjectsListView
        initialProjects={projects}
        organizationId={organizationId}
      />
    )
  }
}
