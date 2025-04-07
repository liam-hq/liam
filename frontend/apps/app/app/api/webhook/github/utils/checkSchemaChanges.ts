import { createClient } from '@/libs/db/server'
import { getPullRequestFiles } from '@liam-hq/github'

type CheckSchemaChangesParams = {
  installationId: number
  pullRequestNumber: number
  pullRequestTitle: string
  projectId: number
  owner: string
  name: string
}

export const checkSchemaChanges = async (
  params: CheckSchemaChangesParams,
): Promise<{ shouldContinue: boolean }> => {
  const { pullRequestNumber, projectId, owner, name, installationId } = params

  // Get changed files from pull request
  const files = await getPullRequestFiles(
    installationId,
    owner,
    name,
    pullRequestNumber,
  )
  const filenames = files.map((file) => file.filename)

  const supabase = await createClient()
  const { data: schemaPaths, error } = await supabase
    .from('GitHubSchemaFilePath')
    .select('path')
    .eq('projectId', projectId)

  if (error) {
    throw new Error('Failed to fetch schema file paths')
  }

  if (!schemaPaths || schemaPaths.length === 0) {
    return { shouldContinue: false }
  }
  // Check if filenames match the paths directly
  const matchedFiles = filenames.filter((filename) =>
    schemaPaths.some((schemaPath) => filename === schemaPath.path),
  )

  if (matchedFiles.length === 0) {
    return { shouldContinue: false }
  }

  return { shouldContinue: true }
}
