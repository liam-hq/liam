import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import type { Artifact } from '@liam-hq/artifact'
import type { Database, Tables } from '@liam-hq/db/supabase/database.types'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import type { Schema } from '@liam-hq/schema'
import type { Operation } from 'fast-json-patch'
import type { ResultAsync } from 'neverthrow'

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
      role: Database['public']['Enums']['assistant_role_enum']
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
      role: Database['public']['Enums']['assistant_role_enum']
    }
  | {
      type: 'query_result'
      queryResultId: string
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

export type CreateWorkflowRunParams = {
  designSessionId: string
  workflowRunId: string
}

export type WorkflowRunResult =
  | {
      success: true
      workflowRun: Tables<'workflow_runs'>
    }
  | {
      success: false
      error: string
    }

export type UpdateWorkflowRunStatusParams = {
  workflowRunId: string
  status: Database['public']['Enums']['workflow_run_status']
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
   * Fetch design session data including organization_id and timeline_items
   */
  getDesignSession(designSessionId: string): Promise<DesignSessionData | null>

  /**
   * Create a new schema version with optimistic locking (atomic operation)
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
   * Upsert an artifact for a design session (insert or update)
   */
  upsertArtifact(
    params: CreateArtifactParams,
  ): ResultAsync<Tables<'artifacts'>, Error>

  /**
   * Get artifact for a design session
   */
  getArtifact(designSessionId: string): Promise<ArtifactResult>

  /**
   * Create a validation query record
   */
  createValidationQuery(params: {
    designSessionId: string
    queryString: string
  }): Promise<
    { success: true; queryId: string } | { success: false; error: string }
  >

  /**
   * Create validation results for a query
   */
  createValidationResults(params: {
    validationQueryId: string
    results: SqlResult[]
  }): Promise<{ success: true } | { success: false; error: string }>

  /**
   * Create a new workflow run record
   */
  createWorkflowRun(params: CreateWorkflowRunParams): Promise<WorkflowRunResult>

  /**
   * Update workflow run status
   */
  updateWorkflowRunStatus(
    params: UpdateWorkflowRunStatusParams,
  ): Promise<WorkflowRunResult>

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
