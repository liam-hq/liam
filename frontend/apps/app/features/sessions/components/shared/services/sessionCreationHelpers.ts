'use server'

import path from 'node:path'
import type { Repositories } from '@liam-hq/agent'
import { createSupabaseRepositories } from '@liam-hq/agent'
import type { SupabaseClientType } from '@liam-hq/db'
import type { Schema } from '@liam-hq/schema'
import { parse, setPrismWasmUrl } from '@liam-hq/schema/parser'
import { redirect } from 'next/navigation'
import { createClient } from '../../../../../libs/db/server'
import { getOrganizationId } from '../../../../organizations/services/getOrganizationId'
import type {
  CreateSessionState,
  SchemaFormat,
} from '../validation/sessionFormValidation'

type SessionCreationParams = {
  parentDesignSessionId?: string | null
  initialMessage: string
  isDeepModelingEnabled: boolean
  projectId?: string | null
  schemaFilePath?: string | null
  gitSha?: string | null
}

const generateSessionName = (initialMessage: string): string => {
  const cleanMessage = initialMessage.trim().replace(/\s+/g, ' ')

  if (!cleanMessage || cleanMessage.length < 3) {
    return `Design Session - ${new Date().toISOString()}`
  }

  const truncated = cleanMessage.slice(0, 20)
  return truncated.length < cleanMessage.length ? `${truncated}...` : truncated
}

type SchemaSource = {
  schema: Schema
  schemaFilePath: string | null
}

const getCurrentUserId = async (
  supabase: SupabaseClientType,
): Promise<string | null> => {
  const { data: userData } = await supabase.auth.getUser()
  return userData?.user?.id || null
}

const createDesignSession = async (
  params: SessionCreationParams,
  supabase: SupabaseClientType,
  organizationId: string,
  currentUserId: string,
): Promise<{ id: string } | CreateSessionState> => {
  const { data: designSession, error: insertError } = await supabase
    .from('design_sessions')
    .insert({
      name: generateSessionName(params.initialMessage),
      project_id: params.projectId,
      organization_id: organizationId,
      created_by_user_id: currentUserId,
      parent_design_session_id: params.parentDesignSessionId,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating design session:', insertError)
    return { success: false, error: 'Failed to create design session' }
  }

  return designSession
}

const createBuildingSchema = async (
  designSessionId: string,
  schema: Schema,
  schemaFilePath: string | null,
  gitSha: string | null,
  supabase: SupabaseClientType,
  organizationId: string,
): Promise<{ id: string } | CreateSessionState> => {
  const { data: buildingSchema, error: buildingSchemaError } = await supabase
    .from('building_schemas')
    .insert({
      design_session_id: designSessionId,
      organization_id: organizationId,
      schema: JSON.parse(JSON.stringify(schema)),
      initial_schema_snapshot: JSON.parse(JSON.stringify(schema)),
      schema_file_path: schemaFilePath,
      git_sha: gitSha,
    })
    .select()
    .single()

  if (buildingSchemaError || !buildingSchema) {
    console.error('Building schema creation error:', buildingSchemaError)
    return { success: false, error: 'Failed to create building schema' }
  }

  return buildingSchema
}

const initializeWorkflowWithMessage = async (
  initialMessage: string,
  designSessionId: string,
  organizationId: string,
  repositories: Repositories,
): Promise<CreateSessionState> => {
  try {
    const { createGraph } = await import('@liam-hq/agent')
    const { HumanMessage } = await import('@langchain/core/messages')

    const checkpointer = repositories.schema.checkpointer
    const compiledGraph = createGraph(checkpointer)

    const userMessage = new HumanMessage({
      content: initialMessage,
    })

    const workflowState = {
      userInput: initialMessage,
      messages: [userMessage],
      schemaData: { tables: {}, enums: {}, extensions: {} },
      testcases: [],
      organizationId,
      buildingSchemaId: '',
      latestVersionNumber: 0,
      designSessionId,
      userId: '',
      next: 'END',
    }

    await compiledGraph.invoke(workflowState, {
      configurable: {
        repositories,
        thread_id: designSessionId,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error initializing workflow with message:', error)
    return {
      success: false,
      error: 'Failed to initialize workflow with message',
    }
  }
}

const saveInitialMessage = async (
  initialMessage: string,
  designSessionId: string,
  organizationId: string,
  _currentUserId: string,
): Promise<CreateSessionState> => {
  const supabase = await createClient()
  const repositories = createSupabaseRepositories(supabase, organizationId)

  const workflowResult = await initializeWorkflowWithMessage(
    initialMessage,
    designSessionId,
    organizationId,
    repositories,
  )

  if (!workflowResult.success) {
    console.error('Error initializing workflow:', workflowResult.error)
    return {
      success: false,
      error: 'Failed to initialize workflow with initial message',
    }
  }

  return { success: true }
}
export const parseSchemaContent = async (
  content: string,
  format: SchemaFormat,
): Promise<Schema | CreateSessionState> => {
  try {
    setPrismWasmUrl(path.resolve(process.cwd(), 'prism.wasm'))
    const { value: parsedSchema, errors } = await parse(content, format)

    if (errors && errors.length > 0) {
      return { success: false, error: 'Failed to parse schema content' }
    }

    return parsedSchema
  } catch (error) {
    console.error('Error parsing schema content:', error)
    return { success: false, error: 'Failed to parse schema content' }
  }
}

export const createSessionWithSchema = async (
  params: SessionCreationParams,
  schemaSource: SchemaSource,
): Promise<CreateSessionState> => {
  const supabase = await createClient()
  const currentUserId = await getCurrentUserId(supabase)
  if (!currentUserId) {
    return { success: false, error: 'Authentication required' }
  }

  const organizationIdResult = await getOrganizationId()
  if (organizationIdResult.isErr()) {
    return { success: false, error: organizationIdResult.error.message }
  }

  const organizationId = organizationIdResult.value

  const designSessionResult = await createDesignSession(
    params,
    supabase,
    organizationId,
    currentUserId,
  )
  if ('success' in designSessionResult) {
    return designSessionResult
  }
  const designSession = designSessionResult

  const buildingSchemaResult = await createBuildingSchema(
    designSession.id,
    schemaSource.schema,
    schemaSource.schemaFilePath,
    params.gitSha || null,
    supabase,
    organizationId,
  )
  if ('success' in buildingSchemaResult) {
    return buildingSchemaResult
  }

  // Save the initial message to timeline
  const messageResult = await saveInitialMessage(
    params.initialMessage,
    designSession.id,
    organizationId,
    currentUserId,
  )
  if (!messageResult.success) {
    return messageResult
  }

  // Just redirect without starting the workflow
  // Pass isDeepModelingEnabled as query parameter
  const queryParams = new URLSearchParams({
    deepModeling: params.isDeepModelingEnabled.toString(),
  })
  redirect(`/app/design_sessions/${designSession.id}?${queryParams.toString()}`)
}
