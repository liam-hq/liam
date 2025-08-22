import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { MemorySaver } from '@langchain/langgraph-checkpoint'
import type { Artifact } from '@liam-hq/artifact'
import type { Tables } from '@liam-hq/db/supabase/database.types'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import type { Schema } from '@liam-hq/schema'
import { schemaSchema } from '@liam-hq/schema'
import { applyPatch } from 'fast-json-patch'
import { errAsync, okAsync, type ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import type {
  ArtifactResult,
  CreateArtifactParams,
  CreateTimelineItemParams,
  CreateVersionParams,
  CreateWorkflowRunParams,
  DesignSessionData,
  SchemaData,
  SchemaRepository,
  TimelineItemResult,
  UpdateArtifactParams,
  UpdateTimelineItemParams,
  UpdateWorkflowRunStatusParams,
  VersionResult,
  WorkflowRunResult,
} from './types'

type InMemoryRepositoryState = {
  schemas: Map<string, SchemaData>
  designSessions: Map<string, DesignSessionData>
  timelineItems: Map<string, Tables<'timeline_items'>>
  artifacts: Map<string, Tables<'artifacts'>>
  validationQueries: Map<
    string,
    { id: string; designSessionId: string; queryString: string }
  >
  validationResults: Map<string, SqlResult[]>
  workflowRuns: Map<string, Tables<'workflow_runs'>>
  versions: Map<string, { id: string; schema: Schema; versionNumber: number }>
  buildingSchemas: Map<
    string,
    {
      id: string
      designSessionId: string
      organizationId: string
      schema: Schema
      latestVersionNumber: number
      updatedAt: string
    }
  >
}

type InMemoryRepositoryOptions = {
  schemas?: Record<string, Schema>
  designSessions?: Record<string, Partial<DesignSessionData>>
  artifacts?: Record<string, Artifact>
  workflowRuns?: Record<string, Partial<Tables<'workflow_runs'>>>
}

export class InMemoryRepository implements SchemaRepository {
  private state: InMemoryRepositoryState
  public checkpointer: BaseCheckpointSaver
  // Used by generateId method
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: used by generateId method
  private idCounter = 1

  constructor(options: InMemoryRepositoryOptions = {}) {
    this.checkpointer = new MemorySaver()
    this.state = {
      schemas: new Map(),
      designSessions: new Map(),
      timelineItems: new Map(),
      artifacts: new Map(),
      validationQueries: new Map(),
      validationResults: new Map(),
      workflowRuns: new Map(),
      versions: new Map(),
      buildingSchemas: new Map(),
    }

    Object.entries(options.schemas || {}).forEach(([id, schema]) => {
      this.state.schemas.set(id, {
        id,
        schema,
        latestVersionNumber: 1,
      })

      // Also initialize building schema entry
      this.state.buildingSchemas.set(id, {
        id,
        designSessionId: id, // Use same ID for simplicity
        organizationId: 'demo-org-id',
        schema,
        latestVersionNumber: 1,
        updatedAt: new Date().toISOString(),
      })
    })

    Object.entries(options.designSessions || {}).forEach(([id, session]) => {
      this.state.designSessions.set(id, {
        organization_id: session.organization_id || 'test-org-id',
        timeline_items: session.timeline_items || [],
      })
    })

    Object.entries(options.artifacts || {}).forEach(
      ([designSessionId, artifact]) => {
        const id = this.generateId()
        this.state.artifacts.set(designSessionId, {
          id,
          design_session_id: designSessionId,
          organization_id: 'test-org-id',
          artifact,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      },
    )

    Object.entries(options.workflowRuns || {}).forEach(([id, workflowRun]) => {
      this.state.workflowRuns.set(id, {
        id,
        workflow_run_id: workflowRun.workflow_run_id || id,
        design_session_id:
          workflowRun.design_session_id || 'test-design-session-id',
        organization_id: workflowRun.organization_id || 'test-org-id',
        status: workflowRun.status || 'pending',
        created_at: workflowRun.created_at || new Date().toISOString(),
        updated_at: workflowRun.updated_at || new Date().toISOString(),
      })
    })
  }

  private generateId(): string {
    return `test-id-${this.idCounter++}`
  }

  private isValidSchema(obj: unknown): obj is Schema {
    const result = v.safeParse(schemaSchema, obj)
    return result.success
  }

  getSchema(designSessionId: string): ResultAsync<SchemaData, Error> {
    const schema = this.state.schemas.get(designSessionId)
    if (!schema) {
      return errAsync(
        new Error(
          `Schema not found for ID: ${designSessionId}. Available schemas: ${Array.from(this.state.schemas.keys()).join(', ')}`,
        ),
      )
    }
    return okAsync(schema)
  }

  async getDesignSession(
    designSessionId: string,
  ): Promise<DesignSessionData | null> {
    return this.state.designSessions.get(designSessionId) || null
  }

  async createVersion(params: CreateVersionParams): Promise<VersionResult> {
    const schema = this.state.schemas.get(params.buildingSchemaId)

    if (!schema) {
      return { success: false, error: 'Building schema not found' }
    }

    const patchResult = applyPatch(schema.schema, params.patch, false, false)
    const updatedSchema = patchResult.newDocument

    if (!this.isValidSchema(updatedSchema)) {
      return { success: false, error: 'Invalid schema after patch' }
    }

    this.state.schemas.set(params.buildingSchemaId, {
      ...schema,
      schema: updatedSchema,
      latestVersionNumber: params.latestVersionNumber + 1,
    })

    // Also update building schema
    const buildingSchema = this.state.buildingSchemas.get(
      params.buildingSchemaId,
    )
    if (buildingSchema) {
      this.state.buildingSchemas.set(params.buildingSchemaId, {
        ...buildingSchema,
        schema: updatedSchema,
        latestVersionNumber: params.latestVersionNumber + 1,
        updatedAt: new Date().toISOString(),
      })
    }

    return { success: true, newSchema: updatedSchema }
  }

  // Helper method for tests that need to create empty versions
  async createEmptyPatchVersion(params: {
    buildingSchemaId: string
    latestVersionNumber: number
  }): Promise<
    { success: true; versionId: string } | { success: false; error: string }
  > {
    const versionId = this.generateId()
    const schema = this.state.schemas.get(params.buildingSchemaId)

    if (!schema) {
      return { success: false, error: 'Building schema not found' }
    }

    this.state.versions.set(versionId, {
      id: versionId,
      schema: schema.schema,
      versionNumber: params.latestVersionNumber + 1,
    })

    this.state.schemas.set(params.buildingSchemaId, {
      ...schema,
      latestVersionNumber: params.latestVersionNumber + 1,
    })

    return { success: true, versionId }
  }

  async createTimelineItem(
    params: CreateTimelineItemParams,
  ): Promise<TimelineItemResult> {
    const id = this.generateId()
    const now = new Date().toISOString()

    const baseItem = {
      id,
      content: params.content,
      user_id: null,
      created_at: now,
      updated_at: now,
      organization_id: 'test-org-id',
      design_session_id: params.designSessionId,
      building_schema_version_id: null,
      query_result_id: null,
      assistant_role: null,
      type: 'user',
    }

    let timelineItem: Tables<'timeline_items'>

    if (params.type === 'user') {
      timelineItem = {
        ...baseItem,
        type: 'user',
        assistant_role: null,
        user_id: params.userId,
      }
    } else if (params.type === 'assistant') {
      timelineItem = {
        ...baseItem,
        type: 'assistant',
        assistant_role: params.role,
        user_id: null,
      }
    } else if (params.type === 'schema_version') {
      timelineItem = {
        ...baseItem,
        type: 'schema_version',
        assistant_role: null,
        user_id: null,
        building_schema_version_id: params.buildingSchemaVersionId,
      }
    } else if (params.type === 'query_result') {
      timelineItem = {
        ...baseItem,
        type: 'query_result',
        assistant_role: null,
        user_id: null,
        query_result_id: params.queryResultId,
      }
    } else if (params.type === 'error') {
      timelineItem = {
        ...baseItem,
        type: 'error',
        assistant_role: null,
        user_id: null,
      }
    } else if (params.type === 'assistant_log') {
      timelineItem = {
        ...baseItem,
        type: 'assistant_log',
        assistant_role: params.role,
        user_id: null,
      }
    } else {
      return { success: false, error: 'Unknown timeline item type' }
    }

    this.state.timelineItems.set(id, timelineItem)

    const designSession = this.state.designSessions.get(params.designSessionId)
    if (designSession) {
      designSession.timeline_items.push({
        id: timelineItem.id,
        content: timelineItem.content,
        type: timelineItem.type,
        user_id: timelineItem.user_id,
        created_at: timelineItem.created_at,
        updated_at: timelineItem.updated_at,
        organization_id: timelineItem.organization_id,
        design_session_id: timelineItem.design_session_id,
        building_schema_version_id: timelineItem.building_schema_version_id,
      })
    }

    return { success: true, timelineItem }
  }

  async updateTimelineItem(
    id: string,
    updates: UpdateTimelineItemParams,
  ): Promise<TimelineItemResult> {
    const timelineItem = this.state.timelineItems.get(id)

    if (!timelineItem) {
      return { success: false, error: 'Timeline item not found' }
    }

    const updatedItem = {
      ...timelineItem,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.state.timelineItems.set(id, updatedItem)

    return { success: true, timelineItem: updatedItem }
  }

  async createArtifact(params: CreateArtifactParams): Promise<ArtifactResult> {
    const id = this.generateId()
    const now = new Date().toISOString()

    const artifact: Tables<'artifacts'> = {
      id,
      design_session_id: params.designSessionId,
      organization_id: 'test-org-id',
      artifact: params.artifact,
      created_at: now,
      updated_at: now,
    }

    this.state.artifacts.set(params.designSessionId, artifact)

    return { success: true, artifact }
  }

  async updateArtifact(params: UpdateArtifactParams): Promise<ArtifactResult> {
    const existing = this.state.artifacts.get(params.designSessionId)

    if (!existing) {
      return { success: false, error: 'Artifact not found' }
    }

    const updated = {
      ...existing,
      artifact: params.artifact,
      updated_at: new Date().toISOString(),
    }

    this.state.artifacts.set(params.designSessionId, updated)

    return { success: true, artifact: updated }
  }

  upsertArtifact(
    params: CreateArtifactParams,
  ): ResultAsync<Tables<'artifacts'>, Error> {
    const { designSessionId, artifact } = params
    const now = new Date().toISOString()

    const existingArtifact = this.state.artifacts.get(designSessionId)

    if (existingArtifact) {
      const updatedArtifact: Tables<'artifacts'> = {
        ...existingArtifact,
        artifact: artifact,
        updated_at: now,
      }
      this.state.artifacts.set(designSessionId, updatedArtifact)
      return okAsync(updatedArtifact)
    }

    const newArtifact: Tables<'artifacts'> = {
      id: this.generateId(),
      design_session_id: designSessionId,
      organization_id: 'test-org-id',
      artifact: artifact,
      created_at: now,
      updated_at: now,
    }

    this.state.artifacts.set(designSessionId, newArtifact)
    return okAsync(newArtifact)
  }

  async getArtifact(designSessionId: string): Promise<ArtifactResult> {
    const artifact = this.state.artifacts.get(designSessionId)

    if (!artifact) {
      return { success: false, error: 'Artifact not found' }
    }

    return { success: true, artifact }
  }

  async createValidationQuery(params: {
    designSessionId: string
    queryString: string
  }): Promise<
    { success: true; queryId: string } | { success: false; error: string }
  > {
    const queryId = this.generateId()

    this.state.validationQueries.set(queryId, {
      id: queryId,
      designSessionId: params.designSessionId,
      queryString: params.queryString,
    })

    return { success: true, queryId }
  }

  async createValidationResults(params: {
    validationQueryId: string
    results: SqlResult[]
  }): Promise<{ success: true } | { success: false; error: string }> {
    if (!this.state.validationQueries.has(params.validationQueryId)) {
      return { success: false, error: 'Validation query not found' }
    }

    this.state.validationResults.set(params.validationQueryId, params.results)

    return { success: true }
  }

  async createWorkflowRun(
    params: CreateWorkflowRunParams,
  ): Promise<WorkflowRunResult> {
    const id = this.generateId()
    const now = new Date().toISOString()

    const workflowRun: Tables<'workflow_runs'> = {
      id,
      workflow_run_id: params.workflowRunId,
      design_session_id: params.designSessionId,
      organization_id: 'test-org-id',
      status: 'pending',
      created_at: now,
      updated_at: now,
    }

    this.state.workflowRuns.set(params.workflowRunId, workflowRun)

    return { success: true, workflowRun }
  }

  async updateWorkflowRunStatus(
    params: UpdateWorkflowRunStatusParams,
  ): Promise<WorkflowRunResult> {
    const workflowRun = this.state.workflowRuns.get(params.workflowRunId)

    if (!workflowRun) {
      return { success: false, error: 'Workflow run not found' }
    }

    const updated = {
      ...workflowRun,
      status: params.status,
      updated_at: new Date().toISOString(),
    }

    this.state.workflowRuns.set(params.workflowRunId, updated)

    return { success: true, workflowRun: updated }
  }

  // Helper methods for testing
  getCurrentSchema(designSessionId: string): Schema | null {
    const schemaData = this.state.schemas.get(designSessionId)
    return schemaData?.schema || null
  }

  getTimelineItems(designSessionId: string): Tables<'timeline_items'>[] {
    return Array.from(this.state.timelineItems.values()).filter(
      (item) => item.design_session_id === designSessionId,
    )
  }

  getWorkflowRun(workflowRunId: string): Tables<'workflow_runs'> | null {
    return this.state.workflowRuns.get(workflowRunId) || null
  }

  getValidationResults(queryId: string): SqlResult[] | null {
    return this.state.validationResults.get(queryId) || null
  }

  /**
   * Get building schema information (InMemory equivalent of building_schemas table)
   */
  getBuildingSchema(buildingSchemaId: string) {
    return this.state.buildingSchemas.get(buildingSchemaId) || null
  }
}
