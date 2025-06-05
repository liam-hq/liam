import { createClient } from '@/libs/db/server'
import { parse } from '@liam-hq/db-structure/parser'
import { getFileContent } from '@liam-hq/github'
import { Panel } from './Panel'

type Props = {
  projectId: string
  branchOrCommit: string
}

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

async function getBuildingSchemaId(projectId: string) {
  const supabase = await createClient()

  // First, get design_session from project
  const { data: designSession, error: sessionError } = await supabase
    .from('design_sessions')
    .select('id')
    .eq('project_id', projectId)
    .single()

  if (sessionError || !designSession) {
    throw new Error('Design session not found for project')
  }

  // Then get building_schema from design_session
  const { data: buildingSchema, error: schemaError } = await supabase
    .from('building_schemas')
    .select('id')
    .eq('design_session_id', designSession.id)
    .single()

  if (schemaError || !buildingSchema) {
    throw new Error('Building schema not found for design session')
  }

  return buildingSchema.id
}

export async function BuildPage({ projectId, branchOrCommit }: Props) {
  const [githubSchemaFilePath, repository, buildingSchemaId] =
    await Promise.all([
      getGithubSchemaFilePath(projectId),
      getGithubRepositoryInfo(projectId),
      getBuildingSchemaId(projectId),
    ])

  const repositoryFullName = `${repository.owner}/${repository.name}`

  const { content } = await getFileContent(
    repositoryFullName,
    githubSchemaFilePath.path,
    branchOrCommit,
    Number(repository.github_installation_identifier),
  )

  const { value: schema, errors } =
    content !== null && githubSchemaFilePath.format !== undefined
      ? await parse(content, githubSchemaFilePath.format)
      : { value: undefined, errors: [] }

  if (!schema) {
    throw new Error('Schema could not be parsed')
  }

  return (
    <Panel
      schema={schema}
      errors={errors || []}
      tableGroups={{}}
      buildingSchemaId={buildingSchemaId}
    />
  )
}
