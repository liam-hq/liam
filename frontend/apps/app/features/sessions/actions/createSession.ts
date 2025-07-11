'use server'

import { createHash } from 'node:crypto'
import path from 'node:path'
import type { SupabaseClientType } from '@liam-hq/db'
import type { TablesInsert } from '@liam-hq/db/supabase/database.types'
import type { Schema } from '@liam-hq/db-structure'
import { parse, setPrismWasmUrl } from '@liam-hq/db-structure/parser'
import { getFileContent } from '@liam-hq/github'
import { deepModelingWorkflowTask } from '@liam-hq/jobs'
import { idempotencyKeys } from '@trigger.dev/sdk'
import { redirect } from 'next/navigation'
import * as v from 'valibot'
import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { createClient } from '@/libs/db/server'

type CreateSessionState = {
  success: boolean
  error?: string
}

// A pipe that transforms an empty string to null.
const emptyStringToNull = v.pipe(
  v.string(),
  v.transform((input) => (input === '' ? null : input)),
)

const FormDataSchema = v.object({
  projectId: v.optional(v.nullable(emptyStringToNull)),
  parentDesignSessionId: v.optional(v.nullable(emptyStringToNull)),
  gitSha: v.optional(v.nullable(v.string())),
  initialMessage: v.pipe(
    v.string(),
    v.minLength(1, 'Initial message is required'),
  ),
  artifactMode: v.optional(
    v.union([v.literal('simple'), v.literal('full')]),
    'full',
  ),
})

type RepositoryData = {
  name: string
  owner: string
  github_installation_identifier: number
}

type ProjectData = {
  id: string
  project_repository_mappings: {
    github_repositories: RepositoryData
  }[]
}

type SchemaFilePathData = {
  path: string
  format: 'schemarb' | 'postgres' | 'prisma' | 'tbls'
}

function parseFormData(
  formData: FormData,
): v.SafeParseResult<typeof FormDataSchema> {
  const rawData = {
    projectId: formData.get('projectId'),
    parentDesignSessionId: formData.get('parentDesignSessionId'),
    gitSha: formData.get('gitSha'),
    initialMessage: formData.get('initialMessage'),
  }

  return v.safeParse(FormDataSchema, rawData)
}

async function getCurrentUserId(
  supabase: SupabaseClientType,
): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser()
  return userData?.user?.id || null
}

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

  return { success: true, schemaFilePathData, repository }
}

async function parseSchemaFromContent(
  content: string,
  format: SchemaFilePathData['format'],
): Promise<Schema | CreateSessionState> {
  setPrismWasmUrl(path.resolve(process.cwd(), 'prism.wasm'))
  const { value: parsedSchema, errors } = await parse(content, format)
  if (errors && errors.length > 0) {
    return { success: false, error: 'Failed to parse schema' }
  }
  return parsedSchema
}

async function processSchema(
  project: ProjectData | null,
  requestGitSha: string | null | undefined,
  supabase: SupabaseClientType,
): Promise<
  { schema: Schema; schemaFilePath: string | null } | CreateSessionState
> {
  if (!project) {
    return {
      schema: { tables: {} },
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

  const schemaResult = await parseSchemaFromContent(
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

export async function createSession(
  _prevState: CreateSessionState,
  formData: FormData,
): Promise<CreateSessionState> {
  const parsedFormDataResult = parseFormData(formData)
  if (!parsedFormDataResult.success) {
    return { success: false, error: 'Invalid form data' }
  }

  const {
    projectId,
    parentDesignSessionId,
    gitSha,
    initialMessage,
    artifactMode,
  } = parsedFormDataResult.output

  const supabase = await createClient()
  const currentUserId = await getCurrentUserId(supabase)
  if (!currentUserId) {
    return { success: false, error: 'Authentication required' }
  }

  const organizationId = await getOrganizationId()
  if (!organizationId) {
    return { success: false, error: 'Organization not found' }
  }

  let project: ProjectData | null = null
  if (projectId) {
    const projectResult = await getProject(supabase, projectId)
    if (projectResult.error) {
      return { success: false, error: projectResult.error.message }
    }
    project = projectResult.data
  }

  const { data: designSession, error: insertError } = await supabase
    .from('design_sessions')
    .insert({
      name: `Design Session - ${new Date().toISOString()}`,
      project_id: projectId,
      organization_id: organizationId,
      created_by_user_id: currentUserId,
      parent_design_session_id: parentDesignSessionId,
      artifact_mode: artifactMode,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating design session:', insertError)
    return { success: false, error: 'Failed to create design session' }
  }

  // Process schema
  const schemaResult = await processSchema(project, gitSha, supabase)
  if ('success' in schemaResult) {
    return schemaResult
  }
  const { schema, schemaFilePath } = schemaResult

  const { data: buildingSchema, error: buildingSchemaError } = await supabase
    .from('building_schemas')
    .insert({
      design_session_id: designSession.id,
      organization_id: organizationId,
      schema: JSON.parse(JSON.stringify(schema)),
      initial_schema_snapshot: JSON.parse(JSON.stringify(schema)),
      schema_file_path: schemaFilePath,
      git_sha: gitSha,
    })
    .select()
    .single()

  if (buildingSchemaError || !buildingSchema) {
    console.error('Error creating building schema:', buildingSchemaError)
    return { success: false, error: 'Failed to create building schema' }
  }

  // Trigger the chat processing job for the initial message
  const history: [string, string][] = []
  const chatPayload = {
    userInput: initialMessage,
    history,
    organizationId,
    buildingSchemaId: buildingSchema.id,
    latestVersionNumber: 0,
    designSessionId: designSession.id,
    userId: currentUserId,
    artifactMode,
  }

  // Generate idempotency key based on the payload
  const payloadHash = createHash('sha256')
    .update(JSON.stringify(chatPayload))
    .digest('hex')

  const idempotencyKey = await idempotencyKeys.create(
    `chat-${designSession.id}-${payloadHash}`,
  )

  // Trigger the chat processing job with idempotency key
  try {
    await deepModelingWorkflowTask.trigger(chatPayload, {
      idempotencyKey,
    })
  } catch (error) {
    console.error('Error triggering chat processing job:', error)
    return { success: false, error: 'Failed to trigger chat processing job' }
  }

  // Redirect to the session page on successful creation
  redirect(`/app/design_sessions/${designSession.id}`)
}
