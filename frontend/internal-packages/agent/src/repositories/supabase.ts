import type { Artifact } from '@liam-hq/artifact'
import { artifactSchema } from '@liam-hq/artifact'
import type { SupabaseClientType } from '@liam-hq/db'
import type { Json } from '@liam-hq/db/supabase/database.types'
import type { Schema } from '@liam-hq/db-structure'
import {
  applyPatchOperations,
  operationsSchema,
  schemaSchema,
} from '@liam-hq/db-structure'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { compare } from 'fast-json-patch'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import { ensurePathStructure } from '../utils/pathPreparation'
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

/**
 * Convert Artifact to Json safely without type casting
 */
const artifactToJson = (artifact: Artifact): Json => {
  return JSON.parse(JSON.stringify(artifact))
}

/**
 * Supabase implementation of SchemaRepository
 */
export class SupabaseSchemaRepository implements SchemaRepository {
  private client: SupabaseClientType

  constructor(client: SupabaseClientType) {
    this.client = client
  }

  async getDesignSession(
    designSessionId: string,
  ): Promise<DesignSessionData | null> {
    // Fetch design session with timeline items
    const { data, error } = await this.client
      .from('design_sessions')
      .select(`
        organization_id,
        timeline_items (
          id,
          content,
          type,
          user_id,
          created_at,
          updated_at,
          organization_id,
          design_session_id,
          building_schema_version_id,
          assistant_role,
          query_result_id
        )
      `)
      .eq('id', designSessionId)
      .order('created_at', {
        ascending: true,
        referencedTable: 'timeline_items',
      })
      .single()

    if (error || !data) {
      console.error(
        `Could not fetch design session data for ${designSessionId}:`,
        error,
      )
      return null
    }

    return {
      organization_id: data.organization_id,
      timeline_items: data.timeline_items || [],
    }
  }

  getSchema(designSessionId: string): ResultAsync<SchemaData, Error> {
    return this.getBuildingSchema(designSessionId)
      .andThen(({ buildingSchema }) =>
        this.getSchemaVersions(buildingSchema.id).map(({ versions }) => ({
          buildingSchema,
          versions,
        })),
      )
      .map(({ buildingSchema, versions }) => {
        const currentSchema = this.buildCurrentSchema(buildingSchema, versions)
        const latestVersionNumber = this.getLatestVersionNumber(versions)
        return {
          id: buildingSchema.id,
          schema: currentSchema,
          latestVersionNumber,
        }
      })
  }

  private getBuildingSchema(
    designSessionId: string,
  ): ResultAsync<
    { buildingSchema: { id: string; initial_schema_snapshot: Json | null } },
    Error
  > {
    return ResultAsync.fromPromise(
      this.client
        .from('building_schemas')
        .select('id, initial_schema_snapshot')
        .eq('design_session_id', designSessionId)
        .single(),
      (error) => new Error(`Failed to get building schema: ${String(error)}`),
    ).andThen(({ data: buildingSchema, error: buildingSchemaError }) => {
      if (buildingSchemaError || !buildingSchema) {
        return errAsync(
          new Error(
            buildingSchemaError?.message || 'Building schema not found',
          ),
        )
      }
      return okAsync({ buildingSchema })
    })
  }

  private getSchemaVersions(
    buildingSchemaId: string,
  ): ResultAsync<
    { versions: Array<{ number: number; patch: unknown }> },
    Error
  > {
    return ResultAsync.fromPromise(
      this.client
        .from('building_schema_versions')
        .select('number, patch')
        .eq('building_schema_id', buildingSchemaId)
        .order('number', { ascending: true }),
      (error) => new Error(`Failed to get schema versions: ${String(error)}`),
    ).andThen(({ data: versions, error: versionsError }) => {
      if (versionsError) {
        return errAsync(new Error(versionsError.message))
      }
      return okAsync({ versions: versions || [] })
    })
  }

  // TODO: Set response type to `{ success: true, data: Schema } | { success: false, error: unknown }`
  // to be able to return errors
  private buildCurrentSchema(
    buildingSchema: { initial_schema_snapshot: unknown },
    versions: Array<{ number: number; patch: unknown }>,
  ): Schema {
    const currentSchema: Record<string, unknown> =
      typeof buildingSchema.initial_schema_snapshot === 'object' &&
      buildingSchema.initial_schema_snapshot !== null
        ? JSON.parse(JSON.stringify(buildingSchema.initial_schema_snapshot))
        : { tables: {} }

    for (const version of versions) {
      const patchParsed = v.safeParse(operationsSchema, version.patch)
      if (patchParsed.success) {
        const pathResult = ensurePathStructure(
          currentSchema,
          patchParsed.output,
        )
        if (pathResult.isErr()) {
          console.warn(
            `Failed to ensure path structure in version ${version.number}: ${pathResult.error}`,
          )
          continue
        }
        applyPatchOperations(currentSchema, patchParsed.output)
      } else {
        console.warn(
          `Invalid patch operations in version ${version.number}:`,
          version.patch,
        )
      }
    }

    // Validate and return as Schema type
    const validationResult = v.safeParse(schemaSchema, currentSchema)
    if (!validationResult.success) {
      console.warn('Schema validation failed, using fallback schema')
      return { tables: {} }
    }

    return validationResult.output
  }

  private getLatestVersionNumber(versions: Array<{ number: number }>): number {
    return versions.length > 0 ? Math.max(...versions.map((v) => v.number)) : 0
  }

  async createVersion(params: CreateVersionParams): Promise<VersionResult> {
    const { buildingSchemaId, latestVersionNumber, patch } = params

    // Generate message content based on patch operations
    const patchCount = patch.length
    const messageContent =
      patchCount === 1
        ? 'Schema updated with 1 change'
        : `Schema updated with ${patchCount} changes`

    const { data: buildingSchema, error } = await this.client
      .from('building_schemas')
      .select(`
        id, organization_id, initial_schema_snapshot, design_session_id
      `)
      .eq('id', buildingSchemaId)
      .maybeSingle()

    if (!buildingSchema || error) {
      return {
        success: false,
        error: `Failed to fetch building schema: ${error?.message}`,
      }
    }

    // Get all previous versions to reconstruct the content
    const { data: previousVersions, error: previousVersionsError } =
      await this.client
        .from('building_schema_versions')
        .select('number, patch')
        .eq('building_schema_id', buildingSchemaId)
        .lte('number', latestVersionNumber)
        .order('number', { ascending: true })

    if (previousVersionsError) {
      return {
        success: false,
        error: `Failed to fetch previous versions: ${previousVersionsError.message}`,
      }
    }

    const patchArrayHistory = previousVersions
      .map((version) => {
        const parsed = v.safeParse(operationsSchema, version.patch)
        if (parsed.success) {
          return parsed.output
        }
        return null
      })
      .filter((patch): patch is NonNullable<typeof patch> => patch !== null)

    const validationResult = v.safeParse(
      schemaSchema,
      buildingSchema.initial_schema_snapshot,
    )

    if (!validationResult.success) {
      return {
        success: false,
        error: 'Invalid initial schema structure',
      }
    }

    let currentContent = JSON.parse(JSON.stringify(validationResult.output))

    // Apply all patches in order
    for (const patchArray of patchArrayHistory) {
      const result = applyPatchOperations(currentContent, patchArray)
      if (result.isErr()) {
        return {
          success: false,
          error: `Failed to apply patch operations: ${result.error.message}`,
        }
      }
      currentContent = result.value
    }

    // Now apply the new patch to get the new content
    const newContentResult = applyPatchOperations(currentContent, patch)
    if (newContentResult.isErr()) {
      return {
        success: false,
        error: `Failed to apply new patch operations: ${newContentResult.error.message}`,
      }
    }
    const newContent = newContentResult.value

    // Validate the new schema structure before proceeding
    const newSchemaValidationResult = v.safeParse(schemaSchema, newContent)

    if (!newSchemaValidationResult.success) {
      return {
        success: false,
        error: 'New schema structure is invalid after applying changes',
      }
    }

    // Calculate reverse patch from new content to current content
    const reversePatch = compare(newContent, currentContent)

    // Get the latest version number for this schema
    const { data: latestVersion, error: latestVersionError } = await this.client
      .from('building_schema_versions')
      .select('number')
      .eq('building_schema_id', buildingSchemaId)
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestVersionError) {
      return {
        success: false,
        error: `Failed to get latest version: ${latestVersionError.message}`,
      }
    }

    // Get the actual latest version number
    const actualLatestVersionNumber = latestVersion ? latestVersion.number : 0

    // Check if the expected version number matches the actual latest version number
    if (latestVersionNumber !== actualLatestVersionNumber) {
      // Version conflict detected
      return {
        success: false,
        error:
          'Version conflict: The schema has been modified since you last loaded it',
      }
    }

    const newVersionNumber = actualLatestVersionNumber + 1

    // Create new version with patch and reverse_patch
    const { data: newVersion, error: createVersionError } = await this.client
      .from('building_schema_versions')
      .insert({
        building_schema_id: buildingSchemaId,
        organization_id: buildingSchema.organization_id,
        number: newVersionNumber,
        patch: JSON.parse(JSON.stringify(patch)),
        reverse_patch: JSON.parse(JSON.stringify(reversePatch)),
      })
      .select('id')
      .single()

    if (createVersionError) {
      return {
        success: false,
        error: createVersionError.message,
      }
    }

    // Update the building schema with the new schema
    const { error: schemaUpdateError } = await this.client
      .from('building_schemas')
      .update({
        schema: newContent,
      })
      .eq('id', buildingSchemaId)

    if (schemaUpdateError) {
      return {
        success: false,
        error: schemaUpdateError.message,
      }
    }

    // Create a timeline item for the schema version
    const timelineResult = await this.createTimelineItem({
      designSessionId: buildingSchema.design_session_id,
      content: messageContent,
      type: 'schema_version',
      buildingSchemaVersionId: newVersion.id,
    })

    if (!timelineResult.success) {
      return {
        success: false,
        error: `Failed to create timeline item: ${timelineResult.error}`,
      }
    }

    return {
      success: true,
      newSchema: newSchemaValidationResult.output,
    }
  }

  async createTimelineItem(
    params: CreateTimelineItemParams,
  ): Promise<TimelineItemResult> {
    const { designSessionId, content, type } = params
    const userId = 'userId' in params ? params.userId : null
    const assistantRole = 'role' in params ? params.role : null
    const buildingSchemaVersionId =
      'buildingSchemaVersionId' in params
        ? params.buildingSchemaVersionId
        : null
    const queryResultId =
      'queryResultId' in params ? params.queryResultId : null
    const now = new Date().toISOString()

    const { data: timelineItem, error } = await this.client
      .from('timeline_items')
      .insert({
        design_session_id: designSessionId,
        content,
        type,
        user_id: userId,
        building_schema_version_id: buildingSchemaVersionId,
        query_result_id: queryResultId,
        updated_at: now,
        assistant_role: assistantRole,
      })
      .select()
      .single()

    if (error) {
      console.error(
        'Failed to save timeline item:',
        JSON.stringify(error, null, 2),
      )
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      timelineItem,
    }
  }

  async updateTimelineItem(
    id: string,
    updates: UpdateTimelineItemParams,
  ): Promise<TimelineItemResult> {
    const now = new Date().toISOString()

    const { data: timelineItem, error } = await this.client
      .from('timeline_items')
      .update({
        ...updates,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(
        'Failed to update timeline item:',
        JSON.stringify(error, null, 2),
      )
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      timelineItem,
    }
  }

  async createArtifact(params: CreateArtifactParams): Promise<ArtifactResult> {
    const { designSessionId, artifact } = params

    // Validate artifact data
    const validationResult = v.safeParse(artifactSchema, artifact)
    if (!validationResult.success) {
      const errorMessages = validationResult.issues
        .map((issue) => `${issue.path?.join('.')} ${issue.message}`)
        .join(', ')
      return {
        success: false,
        error: `Invalid artifact data: ${errorMessages}`,
      }
    }

    const { data: artifactData, error } = await this.client
      .from('artifacts')
      .insert({
        design_session_id: designSessionId,
        artifact: artifactToJson(artifact),
      })
      .select()
      .single()

    if (error) {
      console.error(
        'Failed to create artifact:',
        JSON.stringify(error, null, 2),
      )
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      artifact: artifactData,
    }
  }

  async updateArtifact(params: UpdateArtifactParams): Promise<ArtifactResult> {
    const { designSessionId, artifact } = params

    // Validate artifact data
    const validationResult = v.safeParse(artifactSchema, artifact)
    if (!validationResult.success) {
      const errorMessages = validationResult.issues
        .map((issue) => `${issue.path?.join('.')} ${issue.message}`)
        .join(', ')
      return {
        success: false,
        error: `Invalid artifact data: ${errorMessages}`,
      }
    }

    const { data: artifactData, error } = await this.client
      .from('artifacts')
      .update({
        artifact: artifactToJson(artifact),
      })
      .eq('design_session_id', designSessionId)
      .select()
      .single()

    if (error) {
      console.error(
        'Failed to update artifact:',
        JSON.stringify(error, null, 2),
      )
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      artifact: artifactData,
    }
  }

  async getArtifact(designSessionId: string): Promise<ArtifactResult> {
    const { data: artifactData, error } = await this.client
      .from('artifacts')
      .select('*')
      .eq('design_session_id', designSessionId)
      .maybeSingle()

    if (error) {
      console.error('Failed to get artifact:', JSON.stringify(error, null, 2))
      return {
        success: false,
        error: error.message,
      }
    }

    if (!artifactData) {
      return {
        success: false,
        error: 'Artifact not found',
      }
    }

    return {
      success: true,
      artifact: artifactData,
    }
  }

  async createValidationQuery(params: {
    designSessionId: string
    queryString: string
  }): Promise<
    { success: true; queryId: string } | { success: false; error: string }
  > {
    const { data: validationQuery, error } = await this.client
      .from('validation_queries')
      .insert({
        design_session_id: params.designSessionId,
        query_string: params.queryString,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create validation query:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      queryId: validationQuery.id,
    }
  }

  async createValidationResults(params: {
    validationQueryId: string
    results: SqlResult[]
  }): Promise<{ success: true } | { success: false; error: string }> {
    const validationResults = params.results.map((result) => ({
      validation_query_id: params.validationQueryId,
      result_set: [JSON.parse(JSON.stringify(result.result))],
      executed_at: result.metadata.timestamp,
      status: result.success ? 'success' : 'failure',
      error_message: result.success ? null : JSON.stringify(result.result),
    }))

    const { error } = await this.client
      .from('validation_results')
      .insert(validationResults)

    if (error) {
      console.error('Failed to create validation results:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  }

  async createWorkflowRun(
    params: CreateWorkflowRunParams,
  ): Promise<WorkflowRunResult> {
    const { designSessionId, workflowRunId } = params

    const { data: workflowRun, error } = await this.client
      .from('workflow_runs')
      .insert({
        design_session_id: designSessionId,
        workflow_run_id: workflowRunId,
      })
      .select()
      .single()

    if (error) {
      console.error(
        'Failed to create workflow run:',
        JSON.stringify(error, null, 2),
      )
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      workflowRun,
    }
  }

  async updateWorkflowRunStatus(
    params: UpdateWorkflowRunStatusParams,
  ): Promise<WorkflowRunResult> {
    const { workflowRunId, status } = params

    const { data: workflowRun, error } = await this.client
      .from('workflow_runs')
      .update({ status })
      .eq('workflow_run_id', workflowRunId)
      .select()
      .single()

    if (error) {
      console.error(
        'Failed to update workflow run status:',
        JSON.stringify(error, null, 2),
      )
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      workflowRun,
    }
  }
}
