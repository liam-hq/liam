import { createClient } from '@/libs/db/server'
import { getPullRequestFiles } from '@liam-hq/github'

type CheckSchemaChangesParams = {
  installationId: number
  pullRequestNumber: number
  pullRequestTitle: string
  projectId: string
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

  const supabase = await createClient({ useServiceRole: true })

  const { data: schemaPath, error } = await supabase
    .from('schema_file_paths')
    .select('path')
    .eq('project_id', projectId)
    .single()

  if (error) {
    console.warn(
      `No schema path found for project ${projectId}: ${JSON.stringify(error)}`,
    )
    return { shouldContinue: false }
  }

  // Check if any filename matches the schema path
  const isSchemaFileChanged = filenames.some(
    (filename) => filename === schemaPath.path,
  )

  if (!isSchemaFileChanged) {
    return { shouldContinue: false }
  }

  return { shouldContinue: true }
}
