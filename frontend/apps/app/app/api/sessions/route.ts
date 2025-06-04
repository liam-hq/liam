import path from 'node:path'
import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { createClient } from '@/libs/db/server'
import type { Schema } from '@liam-hq/db-structure'
import { parse, setPrismWasmUrl } from '@liam-hq/db-structure/parser'
import type { TablesInsert } from '@liam-hq/db/supabase/database.types'
import { getLastCommit } from '@liam-hq/github'
import { getFileContent } from '@liam-hq/github'
import { NextResponse } from 'next/server'
import * as v from 'valibot'

const requestParamsSchema = v.object({
  projectId: v.optional(v.string()),
  parentDesignSessionId: v.optional(v.string()),
})

type ValidatedRequestParams = {
  projectId?: string
  parentDesignSessionId?: string
}

type AuthenticatedUser = {
  id: string
}

type ProjectWithRepository = {
  id: string
  project_repository_mappings: {
    github_repositories: {
      name: string
      owner: string
      github_installation_identifier: number
    }
  }[]
}

const validateRequestAndAuth = async (
  request: Request,
): Promise<
  | {
      success: true
      params: ValidatedRequestParams
      user: AuthenticatedUser
      organizationId: string
    }
  | { success: false; response: NextResponse }
> => {
  const requestParams = await request.json()
  const parsedRequestParams = v.safeParse(requestParamsSchema, requestParams)

  if (!parsedRequestParams.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 },
      ),
    }
  }

  const { projectId, parentDesignSessionId } = parsedRequestParams.output

  // Get Supabase client and current user
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      ),
    }
  }

  // Get organization ID
  const organizationId = await getOrganizationId()
  if (!organizationId) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 },
      ),
    }
  }

  return {
    success: true,
    params: { projectId, parentDesignSessionId },
    user: { id: userData.user.id },
    organizationId,
  }
}

const getProjectWithRepository = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  organizationId: string,
): Promise<
  | { success: true; project: ProjectWithRepository }
  | { success: false; response: NextResponse }
> => {
  const { data: project, error: projectError } = await supabase
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
    .eq('organization_id', organizationId)
    .single()

  if (projectError || !project) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 },
      ),
    }
  }

  return {
    success: true,
    project,
  }
}

type SchemaData = {
  content: string
  format: string
  gitSha: string
  schemaFilePath: string | null
}

const fetchSchemaFromGitHub = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  organizationId: string,
): Promise<
  | { success: true; schemaData: SchemaData }
  | { success: false; response: NextResponse }
> => {
  // Get schema file path from schema_file_paths table
  const { data: schemaFilePath, error: schemaFilePathError } = await supabase
    .from('schema_file_paths')
    .select('path, format')
    .eq('project_id', projectId)
    .eq('organization_id', organizationId)
    .limit(1)
    .maybeSingle()

  if (schemaFilePathError) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Failed to fetch schema file path' },
        { status: 500 },
      ),
    }
  }

  // Get repository information for GitHub API call
  const { data: repositoryMapping, error: repositoryMappingError } =
    await supabase
      .from('project_repository_mappings')
      .select(`
      github_repositories(
        id, name, owner, github_installation_identifier
      )
    `)
      .eq('project_id', projectId)
      .single()

  if (repositoryMappingError || !repositoryMapping) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Failed to fetch repository information' },
        { status: 500 },
      ),
    }
  }

  const repository = repositoryMapping.github_repositories

  // Get main branch SHA from GitHub API
  const lastCommit = await getLastCommit(
    Number(repository.github_installation_identifier),
    repository.owner,
    repository.name,
    'main',
  )
  const gitSha = lastCommit?.sha || null
  if (!gitSha) {
    return {
      success: false,
      response: NextResponse.json({ error: 'error' }, { status: 500 }),
    }
  }

  const repositoryFullName = `${repository.owner}/${repository.name}`
  const { content } = await getFileContent(
    repositoryFullName,
    schemaFilePath?.path || 'schema.json',
    gitSha || 'main',
    repository.github_installation_identifier,
  )

  const format = schemaFilePath?.format

  if (!format || !content) {
    return {
      success: false,
      response: NextResponse.json({ error: 'error' }, { status: 500 }),
    }
  }

  return {
    success: true,
    schemaData: {
      content,
      format,
      gitSha,
      schemaFilePath: schemaFilePath?.path || null,
    },
  }
}

type DesignSessionData = {
  id: string
  name: string
  project_id: string | null
  organization_id: string
  created_by_user_id: string
  parent_design_session_id: string | null
}

const createDesignSession = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string | undefined,
  organizationId: string,
  userId: string,
  parentDesignSessionId?: string,
): Promise<
  | { success: true; designSession: DesignSessionData }
  | { success: false; response: NextResponse }
> => {
  const name = `Design Session - ${new Date().toISOString()}`

  const designSessionData: TablesInsert<'design_sessions'> = {
    name,
    project_id: projectId ?? null,
    organization_id: organizationId,
    created_by_user_id: userId,
    parent_design_session_id: parentDesignSessionId ?? null,
  }

  const { data: designSession, error: insertError } = await supabase
    .from('design_sessions')
    .insert(designSessionData)
    .select()
    .single()

  if (insertError) {
    console.error('Error creating design session:', insertError)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Failed to create design session' },
        { status: 500 },
      ),
    }
  }

  return {
    success: true,
    designSession,
  }
}

const parseSchemaAndCreateBuildingSchema = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  designSessionId: string,
  organizationId: string,
  schemaData: SchemaData | null,
): Promise<
  // biome-ignore lint/suspicious/noExplicitAny: todo
  | { success: true; buildingSchema: any }
  | { success: false; response: NextResponse }
> => {
  let schema: Schema
  let gitSha: string | null = null
  let schemaFilePath: string | null = null

  if (schemaData) {
    const {
      content,
      format,
      gitSha: gitShaFromData,
      schemaFilePath: schemaFilePathFromData,
    } = schemaData

    setPrismWasmUrl(path.resolve(process.cwd(), 'prism.wasm'))
    const schemaString = await parse(
      content,
      format as 'schemarb' | 'postgres' | 'prisma' | 'tbls',
    )
    schema = schemaString.value
    gitSha = gitShaFromData
    schemaFilePath = schemaFilePathFromData
  } else {
    // For project-independent design sessions, use default empty schema
    schema = {
      tables: {},
      relationships: {},
      tableGroups: {},
    }
  }

  // Create building schema record
  const buildingSchemaData: TablesInsert<'building_schemas'> = {
    design_session_id: designSessionId,
    organization_id: organizationId,
    schema: JSON.parse(JSON.stringify(schema)),
    initial_schema_snapshot: JSON.parse(JSON.stringify(schema)),
    schema_file_path: schemaFilePath,
    git_sha: gitSha,
  }

  const { data: buildingSchema, error: buildingSchemaError } = await supabase
    .from('building_schemas')
    .insert(buildingSchemaData)
    .select()
    .single()

  if (buildingSchemaError) {
    console.error('Error creating building schema:', buildingSchemaError)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Failed to create building schema' },
        { status: 500 },
      ),
    }
  }

  return {
    success: true,
    buildingSchema,
  }
}

export async function POST(request: Request) {
  const authResult = await validateRequestAndAuth(request)
  if (!authResult.success) {
    return authResult.response
  }

  const {
    params: { projectId, parentDesignSessionId },
    user,
    organizationId,
  } = authResult
  const supabase = await createClient()

  // Initialize project data
  let project = null

  // If projectId is provided, verify that the project exists and belongs to the organization
  if (projectId) {
    const projectResult = await getProjectWithRepository(
      supabase,
      projectId,
      organizationId,
    )
    if (!projectResult.success) {
      return projectResult.response
    }
    project = projectResult.project
  }

  const designSessionResult = await createDesignSession(
    supabase,
    projectId,
    organizationId,
    user.id,
    parentDesignSessionId,
  )
  if (!designSessionResult.success) {
    return designSessionResult.response
  }

  const { designSession } = designSessionResult

  // Prepare schema for building_schemas table
  let schemaData: SchemaData | null = null

  // If project is associated, get schema from repository
  if (project && projectId) {
    const schemaResult = await fetchSchemaFromGitHub(
      supabase,
      projectId,
      organizationId,
    )
    if (!schemaResult.success) {
      return schemaResult.response
    }
    schemaData = schemaResult.schemaData
  }

  const buildingSchemaResult = await parseSchemaAndCreateBuildingSchema(
    supabase,
    designSession.id,
    organizationId,
    schemaData,
  )
  if (!buildingSchemaResult.success) {
    return buildingSchemaResult.response
  }

  const { buildingSchema } = buildingSchemaResult

  return NextResponse.json(
    {
      success: true,
      designSession,
      buildingSchema,
    },
    { status: 201 },
  )
}
