import { safeApplyMultipleSchemaOverrides } from '@/features/buildSchemaOverride/utils'
import { createClient } from '@/libs/db/server'
import { parse } from '@liam-hq/db-structure/parser'
import { getFileContent } from '@liam-hq/github'
import { BuildPageClient } from './BuildPageClient'

type Props = {
  projectId: string
  branchOrCommit: string
}

/**
 * Fetches schema file path information from the database
 */
async function getGithubSchemaFilePath(projectId: string) {
  const supabase = await createClient()
  const { data: gitHubSchemaFilePath, error } = await supabase
    .from('schema_file_paths')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error || !gitHubSchemaFilePath) {
    throw new Error('Schema file path not found')
  }

  return gitHubSchemaFilePath
}

/**
 * Fetches repository information from the database
 */
async function getGithubRepositoryInfo(projectId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      project_repository_mappings(
        github_repositories(*)
      )
    `)
    .eq('id', projectId)
    .single()

  if (error || !data) {
    throw new Error('Project not found')
  }

  const repository = data.project_repository_mappings[0]?.github_repositories
  if (!repository) {
    throw new Error('Repository not found')
  }

  return repository
}

export async function BuildPage({ projectId, branchOrCommit }: Props) {
  // Get schema file path and repository info
  const githubSchemaFilePath = await getGithubSchemaFilePath(projectId)
  const repository = await getGithubRepositoryInfo(projectId)
  const repositoryFullName = `${repository.owner}/${repository.name}`
  const githubInstallationId = Number(repository.github_installation_identifier)

  // Fetch and parse the schema file
  const { content } = await getFileContent(
    repositoryFullName,
    githubSchemaFilePath.path,
    branchOrCommit,
    githubInstallationId,
  )

  const { value: schema, errors } =
    content !== null && githubSchemaFilePath.format !== undefined
      ? await parse(content, githubSchemaFilePath.format)
      : { value: undefined, errors: [] }

  if (!schema) {
    throw new Error('Schema could not be parsed')
  }

  // Apply schema overrides from multiple sources
  const { result, error: overrideError } =
    await safeApplyMultipleSchemaOverrides(
      repositoryFullName,
      branchOrCommit,
      githubInstallationId,
      schema,
      projectId,
    )

  if (overrideError) {
    console.error('Error applying schema overrides:', overrideError)
    return (
      <BuildPageClient
        schema={schema}
        errors={[...errors, overrideError]}
        tableGroups={{}}
      />
    )
  }

  const { schema: overriddenSchema, tableGroups } = result || {
    schema,
    tableGroups: {},
  }

  return (
    <BuildPageClient
      schema={overriddenSchema}
      errors={errors || []}
      tableGroups={tableGroups}
    />
  )
}
