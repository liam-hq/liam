'use server'

import type { SupabaseClientType } from '@liam-hq/db'
import { getFileContent } from '@liam-hq/github'
import type { Schema } from '@liam-hq/schema'
import { createClient } from '@/libs/db/server'
import {
  createSessionWithSchema,
  parseSchemaContent,
} from '../../shared/services/sessionCreationHelpers'
import {
  type CreateSessionState,
  GitHubFormDataSchema,
  type ProjectData,
  parseFormData,
  type RepositoryData,
  type SchemaFilePathData,
} from '../../shared/validation/sessionFormValidation'

async function getProject(
  supabase: SupabaseClientType,
  projectId: string,
): Promise<{ data: ProjectData | null; error: Error | null }> {
  return supabase
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
}

async function getRepositoryInfo(
  supabase: SupabaseClientType,
  projectId: string,
): Promise<
  | { success: false; error: string }
  | {
      success: true
      schemaFilePathData: SchemaFilePathData
      repository: RepositoryData
    }
> {
  const { data: projectData, error } = await supabase
    .from('project_repository_mappings')
    .select(`
      github_repositories(
        id, name, owner, github_installation_identifier
      ),
      projects!inner(
        schema_file_paths(path, format)
      )
    `)
    .eq('project_id', projectId)
    .single()

  if (error || !projectData) {
    return { success: false, error: 'Failed to fetch project information' }
  }

  const repository = projectData.github_repositories
  const schemaFilePathData = projectData.projects?.schema_file_paths?.[0]

  if (!schemaFilePathData) {
    return { success: false, error: 'Schema file path not found' }
  }

  return { success: true, schemaFilePathData, repository }
}

async function processGitHubSchema(
  project: ProjectData | null,
  requestGitSha: string | null | undefined,
  supabase: SupabaseClientType,
): Promise<
  { schema: Schema; schemaFilePath: string | null } | CreateSessionState
> {
  if (!project) {
    return {
      schema: { tables: {}, enums: {} },
      schemaFilePath: null,
    }
  }

  const repoInfoResult = await getRepositoryInfo(supabase, project.id)
  if (!repoInfoResult.success) {
    return repoInfoResult
  }
  const { schemaFilePathData, repository } = repoInfoResult

  const repositoryFullName = `${repository.owner}/${repository.name}`
  const { content } = await getFileContent(
    repositoryFullName,
    schemaFilePathData?.path || 'schema.json',
    requestGitSha || 'main',
    repository.github_installation_identifier,
  )

  if (!content) {
    return { success: false, error: 'Failed to get schema content' }
  }

  const schemaResult = await parseSchemaContent(
    content,
    schemaFilePathData.format,
  )
  if ('success' in schemaResult) {
    return schemaResult
  }

  return {
    schema: schemaResult,
    schemaFilePath: schemaFilePathData.path,
  }
}

export async function createGitHubSession(
  _prevState: CreateSessionState,
  formData: FormData,
): Promise<CreateSessionState> {
  const parsedFormDataResult = parseFormData(formData, GitHubFormDataSchema)
  if (!parsedFormDataResult.success) {
    return { success: false, error: 'Invalid form data' }
  }

  const {
    projectId,
    parentDesignSessionId,
    gitSha,
    initialMessage,
    isDeepModelingEnabled,
  } = parsedFormDataResult.output

  const supabase = await createClient()
  let project: ProjectData | null = null
  if (projectId) {
    const projectResult = await getProject(supabase, projectId)
    if (projectResult.error) {
      return { success: false, error: projectResult.error.message }
    }
    project = projectResult.data
  }

  const schemaResult = await processGitHubSchema(project, gitSha, supabase)
  if ('success' in schemaResult) {
    return schemaResult
  }
  const { schema, schemaFilePath } = schemaResult

  return await createSessionWithSchema(
    {
      projectId,
      parentDesignSessionId,
      gitSha,
      initialMessage,
      isDeepModelingEnabled,
    },
    {
      schema,
      schemaFilePath,
    },
  )
}
