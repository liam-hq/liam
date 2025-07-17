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
import * as v from 'valibot'
import { ensurePathStructure } from '../utils/pathPreparation'
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
          building_schema_version_id
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

  async getSchema(designSessionId: string): Promise<{
    data: SchemaData | null
    error: { message: string } | null
  }> {
    const buildingSchemaResult = await this.getBuildingSchema(designSessionId)
    if (buildingSchemaResult.error || !buildingSchemaResult.data) {
      return buildingSchemaResult
    }

    const { buildingSchema } = buildingSchemaResult.data

    const versionsResult = await this.getSchemaVersions(buildingSchema.id)
    if (versionsResult.error) {
      return versionsResult
    }

    const { versions } = versionsResult.data
    const currentSchema = this.buildCurrentSchema(buildingSchema, versions)
    const latestVersionNumber = this.getLatestVersionNumber(versions)

    return {
      data: {
        id: buildingSchema.id,
        schema: currentSchema,
        latestVersionNumber,
      },
      error: null,
    }
  }

  private async getBuildingSchema(designSessionId: string) {
    const { data: buildingSchema, error: buildingSchemaError } =
      await this.client
        .from('building_schemas')
        .select('id, initial_schema_snapshot')
        .eq('design_session_id', designSessionId)
        .single()

    if (buildingSchemaError || !buildingSchema) {
      return {
        data: null,
        error: buildingSchemaError
          ? { message: buildingSchemaError.message }
          : null,
      }
    }

    return { data: { buildingSchema }, error: null }
  }

  private async getSchemaVersions(buildingSchemaId: string) {
    const { data: versions, error: versionsError } = await this.client
      .from('building_schema_versions')
      .select('number, patch')
      .eq('building_schema_id', buildingSchemaId)
      .order('number', { ascending: true })

    if (versionsError) {
      return {
        data: null,
        error: { message: versionsError.message },
      }
    }

    return { data: { versions: versions || [] }, error: null }
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

  async createEmptyPatchVersion(
    params: CreateEmptyPatchVersionParams,
  ): Promise<CreateVersionResult> {
    const { buildingSchemaId, latestVersionNumber } = params

    // Get the building schema to get organization_id
    const { data: buildingSchema, error: buildingSchemaError } =
      await this.client
        .from('building_schemas')
        .select('organization_id')
        .eq('id', buildingSchemaId)
        .single()

    if (buildingSchemaError || !buildingSchema) {
      return {
        success: false,
        error: `Failed to fetch building schema: ${buildingSchemaError?.message}`,
      }
    }

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

    // Create empty version with null patch and reverse_patch
    const { data: newVersion, error } = await this.client
      .from('building_schema_versions')
      .insert({
        building_schema_id: buildingSchemaId,
        organization_id: buildingSchema.organization_id,
        number: newVersionNumber,
        patch: null,
        reverse_patch: null,
      })
      .select('id')
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      versionId: newVersion.id,
    }
  }

  async updateVersion(params: UpdateVersionParams): Promise<VersionResult> {
    const { buildingSchemaVersionId, patch } = params

    // Get the building schema version
    const { data: version, error: versionError } = await this.client
      .from('building_schema_versions')
      .select('building_schema_id, number')
      .eq('id', buildingSchemaVersionId)
      .single()

    if (versionError || !version) {
      return {
        success: false,
        error: `Failed to fetch building schema version: ${versionError?.message}`,
      }
    }

    // Get the building schema
    const { data: buildingSchema, error } = await this.client
      .from('building_schemas')
      .select(`
        id, organization_id, initial_schema_snapshot, design_session_id
      `)
      .eq('id', version.building_schema_id)
      .maybeSingle()

    if (!buildingSchema || error) {
      return {
        success: false,
        error: `Failed to fetch building schema: ${error?.message}`,
      }
    }

    // Get all previous versions to reconstruct the content (excluding the current version)
    const { data: previousVersions, error: previousVersionsError } =
      await this.client
        .from('building_schema_versions')
        .select('number, patch')
        .eq('building_schema_id', version.building_schema_id)
        .lt('number', version.number)
        .order('number', { ascending: true })

    if (previousVersionsError) {
      return {
        success: false,
        error: `Failed to fetch previous versions: ${previousVersionsError.message}`,
      }
    }

    const patchArrayHistory = previousVersions
      ?.map((version) => {
        const parsed = v.safeParse(operationsSchema, version.patch)
        if (parsed.success) {
          return parsed.output
        }
        return null
      })
      .filter((version) => version !== null)

    // Reconstruct the base content (first version) from the initial schema snapshot
    const baseContent: Record<string, unknown> =
      typeof buildingSchema.initial_schema_snapshot === 'object'
        ? JSON.parse(JSON.stringify(buildingSchema.initial_schema_snapshot))
        : {}

    // Apply all patches in order to get the current content
    const currentContent: Record<string, unknown> = { ...baseContent }

    // Apply all patches in order
    for (const patchArray of patchArrayHistory) {
      // Apply each operation in the patch to currentContent
      applyPatchOperations(currentContent, patchArray)
    }

    // Now apply the new patch to get the new content
    const newContent = JSON.parse(JSON.stringify(currentContent))
    applyPatchOperations(newContent, patch)

    // Validate the new schema structure before proceeding
    const validationResult = v.safeParse(schemaSchema, newContent)
    if (!validationResult.success) {
      const errorMessages = validationResult.issues
        .map((issue) => `${issue.path?.join('.')} ${issue.message}`)
        .join(', ')
      return {
        success: false,
        error: `Invalid schema after applying changes: ${errorMessages}`,
      }
    }

    // Calculate reverse patch from new content to current content
    const reversePatch = compare(newContent, currentContent)

    // Generate message content based on patch operations
    const patchCount = patch.length
    const messageContent =
      patchCount === 1
        ? 'Schema updated with 1 change'
        : `Schema updated with ${patchCount} changes`

    // Update the version with patch and reverse_patch
    const { error: updateError } = await this.client
      .from('building_schema_versions')
      .update({
        patch: JSON.parse(JSON.stringify(patch)),
        reverse_patch: JSON.parse(JSON.stringify(reversePatch)),
      })
      .eq('id', buildingSchemaVersionId)

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      }
    }

    // Update the building schema with the new schema
    const { error: schemaUpdateError } = await this.client
      .from('building_schemas')
      .update({
        schema: newContent,
      })
      .eq('id', version.building_schema_id)

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
      buildingSchemaVersionId: buildingSchemaVersionId,
    })

    if (!timelineResult.success) {
      return {
        success: false,
        error: `Failed to create timeline item: ${timelineResult.error}`,
      }
    }

    return {
      success: true,
      newSchema: validationResult.output,
    }
  }

  async createTimelineItem(
    params: CreateTimelineItemParams,
  ): Promise<TimelineItemResult> {
    const { designSessionId, content, type } = params
    const userId = 'userId' in params ? params.userId : null
    const buildingSchemaVersionId =
      'buildingSchemaVersionId' in params
        ? params.buildingSchemaVersionId
        : null
    const now = new Date().toISOString()

    const { data: timelineItem, error } = await this.client
      .from('timeline_items')
      .insert({
        design_session_id: designSessionId,
        content,
        type,
        user_id: userId,
        building_schema_version_id: buildingSchemaVersionId,
        updated_at: now,
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
    const { designSessionId, runId } = params

    const { data: workflowRun, error } = await this.client
      .from('workflow_runs')
      .insert({
        design_session_id: designSessionId,
        workflow_run_id: runId,
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
    const { runId, status } = params

    const { data: workflowRun, error } = await this.client
      .from('workflow_runs')
      .update({ status })
      .eq('run_id', runId)
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
