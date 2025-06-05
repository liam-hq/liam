import { compare } from 'fast-json-patch'
import * as v from 'valibot'
import type {
  CreateVersionParams,
  Operation,
  SupabaseClient,
  VersionResponse,
} from './types'

const updateBuildingSchemaResultSchema = v.union([
  v.object({
    success: v.literal(true),
    versionNumber: v.number(),
  }),
  v.object({
    success: v.literal(false),
    error: v.string(),
  }),
])

// Operations schema for validation
const operationsSchema = v.array(
  v.object({
    op: v.picklist(['add', 'remove', 'replace', 'move', 'copy', 'test']),
    path: v.string(),
    value: v.optional(v.unknown()),
    from: v.optional(v.string()),
  }),
)

/**
 * Apply patch operations to a target object
 */
export function applyPatchOperations(
  target: Record<string, unknown>,
  operations: Operation[],
): void {
  for (const operation of operations) {
    try {
      // Simple implementation - in production, use a proper JSON Patch library
      if (operation.op === 'add' || operation.op === 'replace') {
        const pathParts = operation.path.split('/').filter(Boolean)
        let current = target

        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i]
          if (part && !(part in current)) {
            current[part] = {}
          }
          if (part) {
            current = current[part] as Record<string, unknown>
          }
        }

        const lastPart = pathParts[pathParts.length - 1]
        if (lastPart) {
          current[lastPart] = operation.value
        }
      }
      // Add other operations as needed
    } catch (error) {
      console.warn('Failed to apply patch operation:', operation, error)
    }
  }
}

/**
 * Create new schema version with patch operations
 * Uses dependency injection for Supabase client to work in different environments
 */
export async function createNewVersion(
  supabase: SupabaseClient,
  { buildingSchemaId, latestVersionNumber, patch }: CreateVersionParams,
): Promise<VersionResponse> {
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

  const patchArrayHistory =
    previousVersions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.map((version: any) => {
        const parsed = v.safeParse(operationsSchema, version.patch)
        if (parsed.success) {
          return parsed.output
        }
        return null
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((version: any): version is Operation[] => version !== null) ?? []

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
    const output = parsedResult.output
    if (output.success) {
      return {
        success: true,
      }
    }
    // TypeScript knows this is the error case
    return {
      success: false,
      error: (output as { success: false; error: string }).error,
    }
  }

  return {
    success: false,
    error: 'Invalid response from server',
  }
}

/**
 * Simplified version that uses RPC function for all logic
 * Suitable for background jobs where minimal dependencies are preferred
 */
export async function createNewVersionSimple(
  supabase: SupabaseClient,
  { buildingSchemaId, latestVersionNumber, patch }: CreateVersionParams,
): Promise<VersionResponse> {
  // Get the latest version number for this schema
  const { data: latestVersion, error: latestVersionError } = await supabase
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
    return {
      success: false,
      error:
        'Version conflict: The schema has been modified since you last loaded it',
    }
  }

  // Use the update_building_schema RPC function
  const { error: rpcError } = await supabase.rpc('update_building_schema', {
    p_schema_id: buildingSchemaId,
    p_schema_schema: {}, // This will be calculated by the RPC function
    p_schema_version_patch: JSON.parse(JSON.stringify(patch)),
    p_schema_version_reverse_patch: [], // This will be calculated by the RPC function
    p_latest_schema_version_number: actualLatestVersionNumber,
  })

  if (rpcError) {
    return {
      success: false,
      error: rpcError.message,
    }
  }

  return {
    success: true,
  }
}
