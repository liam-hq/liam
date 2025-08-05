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

const generateSessionTitle = (firstMessage: string): string => {
  const cleanMessage = firstMessage.trim().replace(/\s+/g, ' ')

  const patterns = [
    {
      regex: /(?:ユーザー|user).*?(?:管理|テーブル|table)/i,
      // eslint-disable-next-line no-non-english/no-non-english-characters
      title: 'ユーザー管理システム',
    },
    {
      regex: /(?:商品|product).*?(?:管理|テーブル|table)/i,
      // eslint-disable-next-line no-non-english/no-non-english-characters
      title: '商品管理システム',
    },
    {
      regex: /(?:注文|order).*?(?:管理|テーブル|table)/i,
      // eslint-disable-next-line no-non-english/no-non-english-characters
      title: '注文管理システム',
    },
    {
      regex: /(?:在庫|inventory).*?(?:管理|システム)/i,
      // eslint-disable-next-line no-non-english/no-non-english-characters
      title: '在庫管理システム',
    },
    {
      regex: /(?:決済|payment).*?(?:システム|テーブル)/i,
      // eslint-disable-next-line no-non-english/no-non-english-characters
      title: '決済システム',
    },
    {
      regex: /(?:ブログ|blog).*?(?:記事|post)/i,
      // eslint-disable-next-line no-non-english/no-non-english-characters
      title: 'ブログシステム',
    },
    {
      regex: /(?:EC|ecommerce).*?(?:サイト|システム)/i,
      // eslint-disable-next-line no-non-english/no-non-english-characters
      title: 'ECサイト',
    },
  ]

  for (const pattern of patterns) {
    if (pattern.regex.test(cleanMessage)) {
      return pattern.title
    }
  }

  if (cleanMessage.length > 20) {
    return `${cleanMessage.slice(0, 20)}...`
  }

  return cleanMessage || `Design Session - ${new Date().toISOString()}`
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
      name: generateSessionTitle(params.initialMessage),
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
  const supabase = await createClient()
  const currentUserId = await getCurrentUserId(supabase)
  if (!currentUserId) {
    return { success: false, error: 'Authentication required' }
  }

  const organizationId = await getOrganizationId()
  if (!organizationId) {
    return { success: false, error: 'Organization not found' }
  }

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
  const buildingSchema = buildingSchemaResult

  const workflowError = await triggerChatWorkflow(
    params.initialMessage,
    params.isDeepModelingEnabled,
    buildingSchema.id,
    designSession.id,
    organizationId,
    currentUserId,
  )
  if (workflowError) {
    return workflowError
  }

  redirect(`/app/design_sessions/${designSession.id}`)
}
