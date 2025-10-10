import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import type { Artifact } from '@liam-hq/artifact'
import type { Tables } from '@liam-hq/db/supabase/database.types'
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

export type CreateArtifactParams = {
  designSessionId: string
  artifact: Artifact
}

export type UpdateArtifactParams = {
  designSessionId: string
  artifact: Artifact
}

export type ArtifactResult =
  | {
      success: true
      artifact: Tables<'artifacts'>
    }
  | {
      success: false
      error: string
    }

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
   * Create a new artifact for a design session
   */
  createArtifact(params: CreateArtifactParams): Promise<ArtifactResult>

  /**
   * Update an existing artifact for a design session
   */
  updateArtifact(params: UpdateArtifactParams): Promise<ArtifactResult>

  /**
   * Upsert an artifact for a design session (insert or update)
   */
  upsertArtifact(
    params: CreateArtifactParams,
  ): ResultAsync<Tables<'artifacts'>, Error>

  /**
   * Create a new workflow run record
   */

  /**
   * Update workflow run status
   */

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
