import { createClient } from '../libs/supabase'

export const getInstallationIdFromRepositoryId = async (
  repositoryId: string,
): Promise<number> => {
  const supabase = createClient()
  const { data: repository, error } = await supabase
    .from('github_repositories')
    .select('github_installation_identifier')
    .eq('id', repositoryId)
    .single()

  if (error || !repository) {
    throw new Error(
      `Repository with ID ${repositoryId} not found: ${JSON.stringify(error)}`,
    )
  }

  return repository.github_installation_identifier
}
