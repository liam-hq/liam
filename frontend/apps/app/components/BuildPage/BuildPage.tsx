import { adaptSchemaForChatbot } from '@/features/chats/services'
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

export async function BuildPage({ projectId, branchOrCommit }: Props) {
  const githubSchemaFilePath = await getGithubSchemaFilePath(projectId)
  const repository = await getGithubRepositoryInfo(projectId)
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

  const adaptedSchema = adaptSchemaForChatbot(schema)

  return (
    <Panel
      schema={schema}
      errors={errors || []}
      tableGroups={{}}
      adaptedSchema={adaptedSchema}
    />
  )
}
