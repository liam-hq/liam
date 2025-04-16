import { createClient } from '../libs/supabase'

export const getInstallationIdFromRepositoryId = async (
  repositoryId: number,
): Promise<number> => {
  const supabase = createClient()
  const { data: repository, error } = await supabase
    .from('Repository')
    .select('installationId')
    .eq('id', repositoryId)
    .single()

  if (error || !repository) {
    throw new Error(
      `Repository with ID ${repositoryId} not found: ${JSON.stringify(error)}`,
    )
  }

  return Number(repository.installationId)
}
