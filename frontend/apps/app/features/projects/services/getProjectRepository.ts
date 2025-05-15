import { createClient } from '@/libs/db/server'

interface ProjectRepository {
  repository: {
    name: string
    owner: string
    github_installation_identifier: number
  }
}

export const getProjectRepository = async (
  projectId: string,
): Promise<ProjectRepository | null> => {
  try {
    const supabase = await createClient()
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_repository_mappings(
          *,
          github_repositories(
            name, owner, github_installation_identifier
          )
        )
      `)
      .eq('id', projectId)
      .single()

    if (error) {
      return null
    }

    const repository =
      project?.project_repository_mappings[0]?.github_repositories
    if (
      !repository?.github_installation_identifier ||
      !repository.owner ||
      !repository.name
    ) {
      console.error('Repository information not found')
      return null
    }

    return {
      repository: {
        name: repository.name,
        owner: repository.owner,
        github_installation_identifier:
          repository.github_installation_identifier,
      },
    }
  } catch (error) {
    console.error('Error in getProjectRepository:', error)
    return null
  }
}
