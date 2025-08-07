'use server'

import { createHash } from 'node:crypto'
import path from 'node:path'
import type { SupabaseClientType } from '@liam-hq/db'
import type { Schema } from '@liam-hq/db-structure'
import { parse, setPrismWasmUrl } from '@liam-hq/db-structure/parser'
import {
  deepModelingWorkflowTask,
  designProcessWorkflowTask,
} from '@liam-hq/jobs'
import { idempotencyKeys } from '@trigger.dev/sdk'
import { redirect } from 'next/navigation'
import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { createClient } from '@/libs/db/server'
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
      name: `Design Session - ${new Date().toISOString()}`,
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
    console.error('Error creating building schema:', buildingSchemaError)
    return { success: false, error: 'Failed to create building schema' }
  }

  return buildingSchema
}

const triggerChatWorkflow = async (
  initialMessage: string,
  isDeepModelingEnabled: boolean,
  buildingSchemaId: string,
  designSessionId: string,
  organizationId: string,
  currentUserId: string,
): Promise<CreateSessionState | null> => {
  const history: [string, string][] = []
  const chatPayload = {
    userInput: initialMessage,
    history,
    organizationId,
    buildingSchemaId,
    latestVersionNumber: 0,
    designSessionId,
    userId: currentUserId,
  }

  const payloadHash = createHash('sha256')
    .update(JSON.stringify(chatPayload))
    .digest('hex')

  const idempotencyKey = await idempotencyKeys.create(
    `chat-${designSessionId}-${payloadHash}`,
  )

  try {
    const task = isDeepModelingEnabled
      ? deepModelingWorkflowTask
      : designProcessWorkflowTask
    await task.trigger(chatPayload, {
      idempotencyKey,
    })
  } catch (error) {
    console.error('Error triggering chat processing job:', error)
    return { success: false, error: 'Failed to trigger chat processing job' }
  }

  return null
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
  console.log('[createSessionWithSchema] Starting session creation', {
    initialMessage: params.initialMessage,
    isDeepModelingEnabled: params.isDeepModelingEnabled,
    schemaFilePath: schemaSource.schemaFilePath,
    timestamp: new Date().toISOString(),
  })

  const supabase = await createClient()
  const currentUserId = await getCurrentUserId(supabase)
  if (!currentUserId) {
    console.error('[createSessionWithSchema] Authentication failed - no current user')
    return { success: false, error: 'Authentication required' }
  }
  console.log('[createSessionWithSchema] Current user ID:', currentUserId)

  const organizationId = await getOrganizationId()
  if (!organizationId) {
    console.error('[createSessionWithSchema] Organization not found')
    return { success: false, error: 'Organization not found' }
  }
  console.log('[createSessionWithSchema] Organization ID:', organizationId)

  console.log('[createSessionWithSchema] Creating design session...')
  const designSessionResult = await createDesignSession(
    params,
    supabase,
    organizationId,
    currentUserId,
  )
  if ('success' in designSessionResult) {
    console.error('[createSessionWithSchema] Failed to create design session:', designSessionResult.error)
    return designSessionResult
  }
  const designSession = designSessionResult
  console.log('[createSessionWithSchema] Design session created:', {
    id: designSession.id,
  })

  console.log('[createSessionWithSchema] Creating building schema...')
  const buildingSchemaResult = await createBuildingSchema(
    designSession.id,
    schemaSource.schema,
    schemaSource.schemaFilePath,
    params.gitSha || null,
    supabase,
    organizationId,
  )
  if ('success' in buildingSchemaResult) {
    console.error('[createSessionWithSchema] Failed to create building schema:', buildingSchemaResult.error)
    return buildingSchemaResult
  }
  const buildingSchema = buildingSchemaResult
  console.log('[createSessionWithSchema] Building schema created:', {
    id: buildingSchema.id,
  })

  console.log('[createSessionWithSchema] Triggering chat workflow...')
  const workflowError = await triggerChatWorkflow(
    params.initialMessage,
    params.isDeepModelingEnabled,
    buildingSchema.id,
    designSession.id,
    organizationId,
    currentUserId,
  )
  if (workflowError) {
    console.error('[createSessionWithSchema] Failed to trigger workflow:', workflowError)
    return workflowError
  }
  console.log('[createSessionWithSchema] Workflow triggered successfully')

  console.log('[createSessionWithSchema] Redirecting to session:', `/app/design_sessions/${designSession.id}`)
  redirect(`/app/design_sessions/${designSession.id}`)
}
