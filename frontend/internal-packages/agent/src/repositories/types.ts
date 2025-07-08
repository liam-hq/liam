import type { Artifact } from '@liam-hq/artifact'
import type { Database, Tables } from '@liam-hq/db/supabase/database.types'
import type { Schema } from '@liam-hq/db-structure'
import type { Operation } from 'fast-json-patch'

export interface SchemaData {
  id: string
  schema: Schema
  latestVersionNumber: number
}

export interface DesignSessionData {
  organization_id: string
  timeline_items: Array<{
    id: string
    content: string
    type: Database['public']['Enums']['timeline_item_type_enum']
    user_id: string | null
    created_at: string
    updated_at: string
    organization_id: string
    design_session_id: string
    building_schema_version_id: string | null
    progress: number | null
  }>
}

export interface CreateVersionParams {
  buildingSchemaId: string
  latestVersionNumber: number
  patch: Operation[]
}

export type VersionResult =
  | { success: true; newSchema: Schema }
  | { success: false; error?: string | null }

export type CreateTimelineItemParams = {
  designSessionId: string
  content: string
} & (
  | {
      type: 'user'
      userId: string
    }
  | {
      type: 'assistant'
    }
  | {
      type: 'schema_version'
      buildingSchemaVersionId: string
    }
  | {
      type: 'error'
    }
  | {
      type: 'progress'
      progress: number
    }
)

export interface UpdateTimelineItemParams {
  content?: string
  progress?: number
}

export type TimelineItemResult =
  | {
      success: true
      timelineItem: Tables<'timeline_items'>
    }
  | {
      success: false
      error: string
    }

export interface CreateArtifactParams {
  designSessionId: string
  artifact: Artifact
}

export interface UpdateArtifactParams {
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
   * Fetch design session data including organization_id and timeline_items
   */
  getDesignSession(designSessionId: string): Promise<DesignSessionData | null>

  /**
   * Create a new schema version with optimistic locking
   */
  createVersion(params: CreateVersionParams): Promise<VersionResult>

  /**
   * Create a new timeline item in the design session
   */
  createTimelineItem(
    params: CreateTimelineItemParams,
  ): Promise<TimelineItemResult>

  /**
   * Update an existing timeline item
   */
  updateTimelineItem(
    id: string,
    updates: UpdateTimelineItemParams,
  ): Promise<TimelineItemResult>

  /**
   * Create a new artifact for a design session
   */
  createArtifact(params: CreateArtifactParams): Promise<ArtifactResult>

  /**
   * Update an existing artifact for a design session
   */
  updateArtifact(params: UpdateArtifactParams): Promise<ArtifactResult>

  /**
   * Get artifact for a design session
   */
  getArtifact(designSessionId: string): Promise<ArtifactResult>
}

/**
 * Repository container for dependency injection
 */
export interface Repositories {
  schema: SchemaRepository
}
