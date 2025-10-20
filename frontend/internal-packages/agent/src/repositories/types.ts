import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import type { Schema } from '@liam-hq/schema'
import type { Operation } from 'fast-json-patch'
import type { ResultAsync } from 'neverthrow'

export type SchemaData = {
  id: string
  schema: Schema
  latestVersionNumber: number
}

export type CreateVersionParams = {
  buildingSchemaId: string
  latestVersionNumber: number
  patch: Operation[]
}

export type VersionResult =
  | { success: true; newSchema: Schema }
  | { success: false; error?: string | null }

export type UserInfo = {
  id: string
  email?: string | null
  userName?: string | null
}

/**
 * Schema repository interface for data access abstraction
 */
export type SchemaRepository = {
  /**
   * Fetch schema data for a design session
   */
  getSchema(designSessionId: string): ResultAsync<SchemaData, Error>

  /**
   * Create a new schema version with optimistic locking (atomic operation)
   */
  createVersion(params: CreateVersionParams): Promise<VersionResult>

  /**
   * Get user information by user ID
   */
  getUserInfo(userId: string): Promise<UserInfo | null>

  /**
   * The checkpoint saver instance
   */
  checkpointer: BaseCheckpointSaver
}

/**
 * Repository container for dependency injection
 */
export type Repositories = {
  schema: SchemaRepository
}
