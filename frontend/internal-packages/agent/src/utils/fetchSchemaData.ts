'use server'

import * as v from 'valibot'
import { createClient } from '../db/server'
import { applyPatchOperations } from './applyPatchOperations'
import { operationsSchema } from './operationsSchema'

interface DesignSessionData {
  organization_id: string
  name: string
}

/**
 * Fetch design session data including organization_id
 * @param designSessionId The design session ID
 * @returns Design session data or null if not found
 */
export async function fetchDesignSessionData(
  designSessionId: string,
): Promise<DesignSessionData | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('design_sessions')
    .select('organization_id, name')
    .eq('id', designSessionId)
    .single()

  if (error || !data) {
    console.error(
      `Could not fetch design session data for ${designSessionId}:`,
      error,
    )
    return null
  }

  return data
}

/**
 * Fetch schema data for a design session
 */
async function querySchemaData(designSessionId: string) {
  const supabase = await createClient()

  // Get building schema with initial snapshot
  const { data: buildingSchema, error: buildingSchemaError } = await supabase
    .from('building_schemas')
    .select('id, initial_schema_snapshot')
    .eq('design_session_id', designSessionId)
    .single()

  if (buildingSchemaError || !buildingSchema) {
    return { data: null, error: buildingSchemaError }
  }

  // Get all schema versions to apply patches
  const { data: versions, error: versionsError } = await supabase
    .from('building_schema_versions')
    .select('number, patch')
    .eq('building_schema_id', buildingSchema.id)
    .order('number', { ascending: true })

  if (versionsError) {
    return { data: null, error: versionsError }
  }

  // Start with initial schema snapshot or empty schema
  const currentSchema: Record<string, unknown> =
    typeof buildingSchema.initial_schema_snapshot === 'object' &&
    buildingSchema.initial_schema_snapshot !== null
      ? JSON.parse(JSON.stringify(buildingSchema.initial_schema_snapshot))
      : { tables: {}, relationships: {}, tableGroups: {} }

  // Apply all patches in order
  if (versions && versions.length > 0) {
    for (const version of versions) {
      // Validate and apply patch operations
      const patchParsed = v.safeParse(operationsSchema, version.patch)
      if (patchParsed.success) {
        applyPatchOperations(currentSchema, patchParsed.output)
      } else {
        console.warn(
          `Invalid patch operations in version ${version.number}:`,
          version.patch,
        )
      }
    }
  }

  // Get the latest version number
  const latestVersionNumber =
    versions && versions.length > 0
      ? Math.max(...versions.map((v) => v.number))
      : 0

  return {
    data: {
      id: buildingSchema.id,
      schema: currentSchema,
      latestVersionNumber,
    },
    error: null,
  }
}

/**
 * Fetch schema data for a design session
 * @param designSessionId The design session ID
 * @returns Schema data or null if not found
 */
export async function fetchSchemaData(designSessionId: string | null) {
  if (!designSessionId) {
    return { data: null, error: null }
  }

  const { data, error } = await querySchemaData(designSessionId)
  return {
    data,
    error: error ? { message: error?.message } : null,
  }
}
