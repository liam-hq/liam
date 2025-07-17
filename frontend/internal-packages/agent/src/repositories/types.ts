import type { Artifact } from '@liam-hq/artifact'
import type { Database, Tables } from '@liam-hq/db/supabase/database.types'
import type { Schema } from '@liam-hq/db-structure'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
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

export type CreateEmptyPatchVersionParams = {
  buildingSchemaId: string
  latestVersionNumber: number
}

export type UpdateVersionParams = {
  buildingSchemaVersionId: string
  patch: Operation[]
}

export type CreateVersionResult =
  | { success: true; versionId: string }
  | { success: false; error?: string | null }

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
  getSchema(designSessionId: string): Promise<{
    data: SchemaData | null
    error: { message: string } | null
  }>

  /**
   * Fetch design session data including organization_id and timeline_items
   */
  getDesignSession(designSessionId: string): Promise<DesignSessionData | null>

  /**
   * Create a new empty schema version (patch/reverse_patch are null)
   */
  createEmptyPatchVersion(
    params: CreateEmptyPatchVersionParams,
  ): Promise<CreateVersionResult>

  /**
   * Update an existing schema version with patch/reverse_patch
   */
  updateVersion(params: UpdateVersionParams): Promise<VersionResult>

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
}

/**
 * Repository container for dependency injection
 */
export type Repositories = {
  schema: SchemaRepository
}
