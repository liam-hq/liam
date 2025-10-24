'use server'

import path from 'node:path'
import type { SupabaseClientType } from '@liam-hq/db'
import type { Schema } from '@liam-hq/schema'
import { parse, setPrismWasmUrl } from '@liam-hq/schema/parser'
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

const getUserInfo = async (supabase: SupabaseClientType, userId: string) => {
  const { data } = await supabase
    .from('users')
    .select('name')
    .eq('id', userId)
    .single()

  return data
}

const createDesignSession = async (
  params: SessionCreationParams,
  supabase: SupabaseClientType,
  organizationId: string,
  currentUserId: string,
): Promise<{ id: string } | CreateSessionState> => {
  const now = new Date().toISOString()
  const { data: designSession, error: insertError } = await supabase
    .from('design_sessions')
    .insert({
      name: generateSessionName(params.initialMessage),
      project_id: params.projectId,
      organization_id: organizationId,
      created_by_user_id: currentUserId,
      parent_design_session_id: params.parentDesignSessionId,
      status: 'running',
      started_at: now,
      finished_at: null,
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

  const userData = await getUserInfo(supabase, currentUserId)
  if (!userData) {
    return { success: false, error: 'Could not fetch user info' }
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
  const designSessionId = designSession.id

  const buildingSchemaResult = await createBuildingSchema(
    designSessionId,
    schemaSource.schema,
    schemaSource.schemaFilePath,
    params.gitSha || null,
    supabase,
    organizationId,
  )
  if ('success' in buildingSchemaResult) {
    return buildingSchemaResult
  }

  const redirectTo = `/design_sessions/${designSessionId}`

  return {
    success: true,
    designSessionId,
    redirectTo,
    userName: userData.name,
    initialMessage: params.initialMessage,
  }
}
