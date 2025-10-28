import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import type { SupabaseClientType } from '@liam-hq/db'
import type { Json } from '@liam-hq/db/supabase/database.types'
import { errAsync, okAsync, ResultAsync } from '@liam-hq/neverthrow'
import type { Schema } from '@liam-hq/schema'
import {
  applyPatchOperations,
  operationsSchema,
  schemaSchema,
} from '@liam-hq/schema'
import { compare } from 'fast-json-patch'
import * as v from 'valibot'
import { SupabaseCheckpointSaver } from '../checkpoint/SupabaseCheckpointSaver'
import { ensurePathStructure } from '../utils/pathPreparation'
import type {
  CreateVersionParams,
  SchemaData,
  SchemaRepository,
  UserInfo,
  VersionResult,
} from './types'

/**
 * Supabase implementation of SchemaRepository with checkpoint functionality
 */
export class SupabaseSchemaRepository implements SchemaRepository {
  private client: SupabaseClientType
  public checkpointer: BaseCheckpointSaver

  constructor(client: SupabaseClientType, organizationId: string) {
    this.client = client
    this.checkpointer = new SupabaseCheckpointSaver({
      client: this.client,
      options: { organizationId },
    })
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
        : { tables: {}, enums: {}, extensions: {} }

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
        const patchResult = applyPatchOperations(
          currentSchema,
          patchParsed.output,
        )
        if (patchResult.isOk()) {
          Object.assign(currentSchema, patchResult.value)
        } else {
          // Failed to apply patch for this version, continue with next
        }
      } else {
        console.warn(
          `Invalid patch operations in version ${version.number}:`,
          version.patch,
        )
      }
    }

    const validationResult = v.safeParse(schemaSchema, currentSchema)
    if (!validationResult.success) {
      // Schema validation failed, using fallback schema
      return { tables: {}, enums: {}, extensions: {} }
    }

    return validationResult.output
  }

  private getLatestVersionNumber(versions: Array<{ number: number }>): number {
    return versions.length > 0 ? Math.max(...versions.map((v) => v.number)) : 0
  }

  async createVersion(params: CreateVersionParams): Promise<VersionResult> {
    const { buildingSchemaId, latestVersionNumber, patch } = params

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

    const newSchemaValidationResult = v.safeParse(schemaSchema, newContent)

    if (!newSchemaValidationResult.success) {
      return {
        success: false,
        error: 'New schema structure is invalid after applying changes',
      }
    }

    // Calculate reverse patch from new content to current content
    const reversePatch = compare(newContent, currentContent)

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

    const { error: createVersionError } = await this.client
      .from('building_schema_versions')
      .insert({
        building_schema_id: buildingSchemaId,
        organization_id: buildingSchema.organization_id,
        number: newVersionNumber,
        patch: JSON.parse(JSON.stringify(patch)),
        reverse_patch: JSON.parse(JSON.stringify(reversePatch)),
      })

    if (createVersionError) {
      return {
        success: false,
        error: createVersionError.message,
      }
    }

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

    return {
      success: true,
      newSchema: newSchemaValidationResult.output,
    }
  }

  async getUserInfo(userId: string): Promise<UserInfo | null> {
    const { data, error } = await this.client
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single()

    if (error || !data) {
      console.error(`Could not fetch user info for ${userId}:`, error)
      return null
    }

    return {
      id: data.id,
      email: data.email,
      userName: data.name,
    }
  }
}
