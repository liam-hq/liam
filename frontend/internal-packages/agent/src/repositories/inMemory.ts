import type { Artifact } from '@liam-hq/artifact'
import type { Database, Tables } from '@liam-hq/db/supabase/database.types'
import type { Schema } from '@liam-hq/db-structure'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import pkg from 'fast-json-patch'
const { applyPatch } = pkg
import type { Operation } from 'fast-json-patch'
import { v4 as uuidv4 } from 'uuid'
import type {
  ArtifactResult,
  CreateArtifactParams,
  CreateEmptyPatchVersionParams,
  CreateTimelineItemParams,
  CreateVersionResult,
  CreateWorkflowRunParams,
  DesignSessionData,
  SchemaData,
  SchemaRepository,
  TimelineItemResult,
  UpdateArtifactParams,
  UpdateTimelineItemParams,
  UpdateVersionParams,
  UpdateWorkflowRunStatusParams,
  VersionResult,
  WorkflowRunResult,
} from './types.ts'

/**
 * In-memory implementation of SchemaRepository for testing/offline use
 */
export class InMemorySchemaRepository implements SchemaRepository {
  private schemas: Map<string, SchemaData> = new Map()
  private designSessions: Map<string, DesignSessionData> = new Map()
  private timelineItems: Map<string, Tables<'timeline_items'>> = new Map()
  private artifacts: Map<string, Tables<'artifacts'>> = new Map()
  private workflowRuns: Map<string, Tables<'workflow_runs'>> = new Map()
  private validationQueries: Map<string, { designSessionId: string; queryString: string }> = new Map()
  private validationResults: Map<string, SqlResult[]> = new Map()
  private schemaVersions: Map<string, { id: string; schema: Schema; patch: Operation[] | null }> = new Map()

  async getSchema(designSessionId: string): Promise<{
    data: SchemaData | null
    error: { message: string } | null
  }> {
    const schema = this.schemas.get(designSessionId)
    if (!schema) {
      return { data: null, error: null }
    }
    return { data: schema, error: null }
  }

  async getDesignSession(designSessionId: string): Promise<DesignSessionData | null> {
    const session = this.designSessions.get(designSessionId)
    if (!session) {
      // Create a default session if it doesn't exist
      const defaultSession: DesignSessionData = {
        organization_id: 'default-org',
        timeline_items: []
      }
      this.designSessions.set(designSessionId, defaultSession)
      return defaultSession
    }
    return session
  }

  async createEmptyPatchVersion(params: CreateEmptyPatchVersionParams): Promise<CreateVersionResult> {
    const versionId = uuidv4()
    const schema = this.schemas.get(params.buildingSchemaId)
    
    if (!schema) {
      // Create a default empty schema if it doesn't exist
      const defaultSchema: Schema = {
        tables: {},
        relations: []
      }
      this.schemas.set(params.buildingSchemaId, {
        id: params.buildingSchemaId,
        schema: defaultSchema,
        latestVersionNumber: 1
      })
    }

    this.schemaVersions.set(versionId, {
      id: versionId,
      schema: schema?.schema || { tables: {}, relations: [] },
      patch: null
    })

    return { success: true, versionId }
  }

  async updateVersion(params: UpdateVersionParams): Promise<VersionResult> {
    const version = this.schemaVersions.get(params.buildingSchemaVersionId)
    if (!version) {
      return { success: false, error: 'Version not found' }
    }

    try {
      const newSchema = applyPatch(version.schema, params.patch).newDocument as Schema
      version.schema = newSchema
      version.patch = params.patch
      
      return { success: true, newSchema }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async createTimelineItem(params: CreateTimelineItemParams): Promise<TimelineItemResult> {
    const timelineItemId = uuidv4()
    const now = new Date().toISOString()
    
    const timelineItem: Tables<'timeline_items'> = {
      id: timelineItemId,
      content: params.content,
      type: params.type as Database['public']['Enums']['timeline_item_type_enum'],
      user_id: 'type' in params && params.type === 'user' ? params.userId : null,
      created_at: now,
      updated_at: now,
      organization_id: 'default-org',
      design_session_id: params.designSessionId,
      building_schema_version_id: 'type' in params && params.type === 'schema_version' ? params.buildingSchemaVersionId : null
    }

    this.timelineItems.set(timelineItemId, timelineItem)

    // Add to design session
    const session = await this.getDesignSession(params.designSessionId)
    if (session) {
      session.timeline_items.push(timelineItem)
    }

    return { success: true, timelineItem }
  }

  async updateTimelineItem(id: string, updates: UpdateTimelineItemParams): Promise<TimelineItemResult> {
    const timelineItem = this.timelineItems.get(id)
    if (!timelineItem) {
      return { success: false, error: 'Timeline item not found' }
    }

    if (updates.content !== undefined) {
      timelineItem.content = updates.content
    }
    timelineItem.updated_at = new Date().toISOString()

    return { success: true, timelineItem }
  }

  async createArtifact(params: CreateArtifactParams): Promise<ArtifactResult> {
    const artifactId = uuidv4()
    const now = new Date().toISOString()

    const artifact: Tables<'artifacts'> = {
      id: artifactId,
      type: params.artifact.type,
      content: params.artifact.content,
      created_at: now,
      updated_at: now,
      organization_id: 'default-org',
      design_session_id: params.designSessionId
    }

    this.artifacts.set(artifactId, artifact)
    return { success: true, artifact }
  }

  async updateArtifact(params: UpdateArtifactParams): Promise<ArtifactResult> {
    // Find existing artifact for this design session
    const existingArtifact = Array.from(this.artifacts.values()).find(
      a => a.design_session_id === params.designSessionId
    )

    if (existingArtifact) {
      existingArtifact.type = params.artifact.type
      existingArtifact.content = params.artifact.content
      existingArtifact.updated_at = new Date().toISOString()
      return { success: true, artifact: existingArtifact }
    }

    // Create new artifact if none exists
    return this.createArtifact(params)
  }

  async getArtifact(designSessionId: string): Promise<ArtifactResult> {
    const artifact = Array.from(this.artifacts.values()).find(
      a => a.design_session_id === designSessionId
    )

    if (!artifact) {
      return { success: false, error: 'Artifact not found' }
    }

    return { success: true, artifact }
  }

  async createValidationQuery(params: {
    designSessionId: string
    queryString: string
  }): Promise<{ success: true; queryId: string } | { success: false; error: string }> {
    const queryId = uuidv4()
    this.validationQueries.set(queryId, {
      designSessionId: params.designSessionId,
      queryString: params.queryString
    })
    return { success: true, queryId }
  }

  async createValidationResults(params: {
    validationQueryId: string
    results: SqlResult[]
  }): Promise<{ success: true } | { success: false; error: string }> {
    this.validationResults.set(params.validationQueryId, params.results)
    return { success: true }
  }

  async createWorkflowRun(params: CreateWorkflowRunParams): Promise<WorkflowRunResult> {
    const now = new Date().toISOString()
    const workflowRun: Tables<'workflow_runs'> = {
      id: uuidv4(),
      run_id: params.runId,
      status: 'pending' as Database['public']['Enums']['workflow_run_status'],
      created_at: now,
      updated_at: now,
      organization_id: 'default-org',
      design_session_id: params.designSessionId
    }

    this.workflowRuns.set(params.runId, workflowRun)
    return { success: true, workflowRun }
  }

  async updateWorkflowRunStatus(params: UpdateWorkflowRunStatusParams): Promise<WorkflowRunResult> {
    const workflowRun = this.workflowRuns.get(params.runId)
    if (!workflowRun) {
      return { success: false, error: 'Workflow run not found' }
    }

    workflowRun.status = params.status
    workflowRun.updated_at = new Date().toISOString()

    return { success: true, workflowRun }
  }
}