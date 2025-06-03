import path from 'node:path'
import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { createClient } from '@/libs/db/server'
import { parse, setPrismWasmUrl } from '@liam-hq/db-structure/parser'
import type { TablesInsert } from '@liam-hq/db/supabase/database.types'
import { getLastCommit } from '@liam-hq/github'
import { getFileContent } from '@liam-hq/github'
import { NextResponse } from 'next/server'
import * as v from 'valibot'

const requestParamsSchema = v.object({
  projectId: v.string(),
  parentDesignSessionId: v.optional(v.string()),
})

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO refactor later
export async function POST(request: Request) {
  const requestParams = await request.json()
  const parsedRequestParams = v.safeParse(requestParamsSchema, requestParams)

  if (!parsedRequestParams.success) {
    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 },
    )
  }

  const { projectId, parentDesignSessionId } = parsedRequestParams.output

  // Get Supabase client and current user
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    )
  }

  // Get organization ID
  const organizationId = await getOrganizationId()
  if (!organizationId) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 400 },
    )
  }

  // Verify that the project exists and belongs to the organization
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
    return NextResponse.json(
      { error: 'Project not found or access denied' },
      { status: 404 },
    )
  }

  const name = `Design Session - ${new Date().toISOString()}`

  // Create design session record
  const designSessionData: TablesInsert<'design_sessions'> = {
    name,
    project_id: projectId,
    organization_id: organizationId,
    created_by_user_id: userData.user.id,
    parent_design_session_id: parentDesignSessionId ?? null,
  }

  const { data: designSession, error: insertError } = await supabase
    .from('design_sessions')
    .insert(designSessionData)
    .select()
    .single()

  if (insertError) {
    console.error('Error creating design session:', insertError)
    return NextResponse.json(
      { error: 'Failed to create design session' },
      { status: 500 },
    )
  }

  let buildingSchema = null
  if (project) {
    // Get schema file path from schema_file_paths table
    const { data: schemaFilePath, error: schemaFilePathError } = await supabase
      .from('schema_file_paths')
      .select('path, format')
      .eq('project_id', projectId)
      .eq('organization_id', organizationId)
      .limit(1)
      .maybeSingle()

    if (schemaFilePathError) {
      return NextResponse.json(
        { error: 'Failed to fetch schema file path' },
        { status: 500 },
      )
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
      return NextResponse.json(
        { error: 'Failed to fetch repository information' },
        { status: 500 },
      )
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
      return NextResponse.json({ error: 'error' }, { status: 500 })
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
      return NextResponse.json({ error: 'error' }, { status: 500 })
    }

    setPrismWasmUrl(path.resolve(process.cwd(), 'prism.wasm'))
    const schemaString = await parse(content, format)
    const schema = JSON.parse(JSON.stringify(schemaString.value))

    // Create building schema record
    const buildingSchemaInsertData: TablesInsert<'building_schemas'> = {
      design_session_id: designSession.id,
      organization_id: organizationId,
      schema,
      initial_schema_snapshot: schema,
      schema_file_path: schemaFilePath?.path ?? null,
      git_sha: gitSha,
    }

    const { data: buildingSchemaData, error: buildingSchemaError } =
      await supabase
        .from('building_schemas')
        .insert(buildingSchemaInsertData)
        .select()
        .single()

    if (buildingSchemaError) {
      console.error('Error creating building schema:', buildingSchemaError)
      return NextResponse.json(
        { error: 'Failed to create building schema' },
        { status: 500 },
      )
    }
    buildingSchema = buildingSchemaData
  }

  return NextResponse.json(
    {
      success: true,
      designSession,
      buildingSchema,
    },
    { status: 201 },
  )
}
