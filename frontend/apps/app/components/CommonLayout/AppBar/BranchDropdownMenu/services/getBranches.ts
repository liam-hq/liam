import { type GitHubBranch, getRepositoryBranches } from '@liam-hq/github'
import { createClient } from '../../../../../libs/db/server'

export async function getBranches(projectId: string): Promise<GitHubBranch[]> {
  const supabase = await createClient()
  const { data: mapping, error } = await supabase
    .from('project_repository_mappings')
    .select(`
      github_repositories(
        id, name, owner, github_installation_identifier
      )
    `)
    .eq('project_id', projectId)
    .single()

  if (error) {
    return []
  }

  const repository = mapping.github_repositories
  const branches = await getRepositoryBranches(
    Number(repository.github_installation_identifier),
    repository.owner,
    repository.name,
  )

  return branches
}
