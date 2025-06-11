import { schemaSchema } from '@liam-hq/db-structure'
import { type Operation, compare } from 'fast-json-patch'
import * as v from 'valibot'
import { createClient } from '../db/server'
import { applyPatchOperations } from './applyPatchOperations'
import { operationsSchema } from './operationsSchema'

const updateBuildingSchemaResultSchema = v.union([
  v.object({
    success: v.literal(true),
    versionNumber: v.number(),
  }),
  v.object({
    success: v.literal(false),
    error: v.nullable(v.string()),
  }),
])

interface CreateVersionParams {
  buildingSchemaId: string
  latestVersionNumber: number
  patch: Operation[]
}

interface VersionResponse {
  success: boolean
  error?: string | null
}

export async function createNewVersion({
  buildingSchemaId,
  latestVersionNumber,
  patch,
}: CreateVersionParams): Promise<VersionResponse> {
  const supabase = await createClient()

  const { data: buildingSchema, error } = await supabase
    .from('building_schemas')
    .select(`
      id, organization_id, initial_schema_snapshot
    `)
    .eq('id', buildingSchemaId)
    .maybeSingle()

  if (!buildingSchema || error) {
    throw new Error(`Failed to fetch building schema: ${error?.message}`)
  }

  // Get all previous versions to reconstruct the content
  const { data: previousVersions, error: previousVersionsError } =
    await supabase
      .from('building_schema_versions')
      .select('number, patch')
      .eq('building_schema_id', buildingSchemaId)
      .lte('number', latestVersionNumber)
      .order('number', { ascending: true })

  if (previousVersionsError) {
    throw new Error(
      `Failed to fetch previous versions: ${previousVersionsError.message}`,
    )
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

  // Get the latest version number for this schema
  const { data: latestVersion, error: latestVersionError } = await supabase
    .from('building_schema_versions')
    .select('number')
    .eq('building_schema_id', buildingSchemaId)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestVersionError) {
    throw new Error(
      `Failed to get latest version: ${latestVersionError.message}`,
    )
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

  const { data, error: rpcError } = await supabase.rpc(
    'update_building_schema',
    {
      p_schema_id: buildingSchemaId,
      p_schema_schema: newContent,
      p_schema_version_patch: JSON.parse(JSON.stringify(patch)),
      p_schema_version_reverse_patch: JSON.parse(JSON.stringify(reversePatch)),
      p_latest_schema_version_number: actualLatestVersionNumber,
    },
  )

  const parsedResult = v.safeParse(updateBuildingSchemaResultSchema, data)

  if (rpcError) {
    return {
      success: false,
      error: rpcError.message,
    }
  }

  if (parsedResult.success) {
    if (parsedResult.output.success) {
      return {
        success: true,
      }
    }
    return {
      success: false,
      error: parsedResult.output.error,
    }
  }
  return {
    success: false,
    error: 'Invalid response from server',
  }
}
