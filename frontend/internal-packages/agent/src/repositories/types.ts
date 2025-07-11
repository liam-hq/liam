import type { Artifact } from '@liam-hq/artifact'
import type { Database, Tables } from '@liam-hq/db/supabase/database.types'
import type { Schema } from '@liam-hq/db-structure'
import type { Operation } from 'fast-json-patch'

export type SchemaData = {
  id: string
  schema: Schema
  latestVersionNumber: number
}

export type DesignSessionData = {
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
  }>
}

// export type Work

export type CreateVersionParams = {
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
      type: 'assistant_log'
    }
)

export type UpdateTimelineItemParams = {
  content?: string
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

export type CreateWorkflowExecutionParams = {
  designSessionId: string
  organizationId: string
  status?: Database['public']['Enums']['execution_status_enum']
  startedAt?: string
}

export type WorkflowExecutionResult =
  | {
      success: true
      workflowExecution: Tables<'workflow_executions'>
    }
  | {
      success: false
      error: string
    }

export type UpdateWorkflowExecutionParams = {
  id: string
  status?: Database['public']['Enums']['execution_status_enum']
  errorMessage?: string
  completedAt?: string
}

/**
 * Schema repository interface for data access abstraction
 */
export type SchemaRepository = {
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

  /**
   * Create a new workflow execution
   */
  createWorkflowExecution(
    params: CreateWorkflowExecutionParams,
  ): Promise<WorkflowExecutionResult>

  /**
   * Update an existing workflow execution
   */
  updateWorkflowExecution(
    params: UpdateWorkflowExecutionParams,
  ): Promise<WorkflowExecutionResult>
}

/**
 * Repository container for dependency injection
 */
export type Repositories = {
  schema: SchemaRepository
}
