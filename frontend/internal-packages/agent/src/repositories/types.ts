import type { Database, Tables } from '@liam-hq/db/supabase/database.types'
import type { Operation } from 'fast-json-patch'

export interface SchemaData {
  id: string
  schema: Record<string, unknown>
  latestVersionNumber: number
}

export interface DesignSessionData {
  organization_id: string
  messages: Array<{
    id: string
    content: string
    role: Database['public']['Enums']['message_role_enum']
    user_id: string | null
    created_at: string
    updated_at: string
    organization_id: string
    design_session_id: string
    building_schema_version_id: string | null
  }>
}

export interface CreateVersionParams {
  buildingSchemaId: string
  latestVersionNumber: number
  patch: Operation[]
}

export interface VersionResult {
  success: boolean
  error?: string | null
}

export type CreateMessageParams = {
  designSessionId: string
  content: string
} & (
  | {
      role: 'user'
      userId: string
    }
  | {
      role: 'assistant'
    }
  | {
      role: 'schema_version'
      buildingSchemaVersionId: string
    }
)

export type MessageResult =
  | {
      success: true
      message: Tables<'messages'>
    }
  | {
      success: false
      error: string
    }

/**
 * Schema repository interface for data access abstraction
 */
export interface SchemaRepository {
  /**
   * Fetch schema data for a design session
   */
  getSchema(designSessionId: string): Promise<{
    data: SchemaData | null
    error: { message: string } | null
  }>

  /**
   * Fetch design session data including organization_id and messages
   */
  getDesignSession(designSessionId: string): Promise<DesignSessionData | null>

  /**
   * Create a new schema version with optimistic locking
   */
  createVersion(params: CreateVersionParams): Promise<VersionResult>

  /**
   * Create a new message in the design session
   */
  createMessage(params: CreateMessageParams): Promise<MessageResult>
}

/**
 * Repository container for dependency injection
 */
export interface ValidationRepository {
  createValidationQuery(params: {
    designSessionId: string
    queryString: string
  }): Promise<{ success: boolean; id?: string; error?: string }>

  createValidationResult(params: {
    validationQueryId: string
    resultSet: string | null
    status: 'success' | 'failure'
    errorMessage?: string | null
  }): Promise<{ success: boolean; error?: string }>
}

export interface Repositories {
  schema: SchemaRepository
  validation: ValidationRepository
}
