import { createClient } from '@/libs/db/server'
import type { SchemaOverride } from '@liam-hq/db-structure'
import {
  buildSchemaOverrideFromDB,
  fetchSchemaOverrides,
  getSchemaOverrideSources,
} from './fetchSchemaOverrides'

/**
 * Gets all schema overrides for a specific branch or commit
 *
 * This function collects schema overrides from both file sources and database
 *
 * @param repositoryFullName Repository full name (owner/repo)
 * @param repositoryId Repository ID
 * @param branchOrCommit Branch or commit ID
 * @param githubInstallationIdentifier GitHub installation ID
 * @param projectId Project ID
 * @returns Array of schema overrides
 */
export async function getBranchSchemaOverrides(
  repositoryFullName: string,
  repositoryId: string,
  branchOrCommit: string,
  githubInstallationIdentifier: number,
  projectId: string,
): Promise<SchemaOverride[]> {
  const supabase = await createClient()
  const overrides: SchemaOverride[] = []

  try {
    // Get file-based overrides
    const overrideSources = await getSchemaOverrideSources(projectId)
    const fileOverrides = await fetchSchemaOverrides(
      repositoryFullName,
      branchOrCommit,
      githubInstallationIdentifier,
      overrideSources,
    )

    if (fileOverrides && Array.isArray(fileOverrides)) {
      overrides.push(...fileOverrides)
    }

    // Get database-based overrides
    const dbOverride = await buildSchemaOverrideFromDB(
      projectId,
      repositoryId,
      branchOrCommit,
      supabase,
    )

    if (dbOverride) {
      overrides.push(dbOverride)
    }

    return overrides
  } catch (error) {
    console.error('Failed to get branch schema overrides:', error)
    return []
  }
}

// Function hasBranchSchemaOverrides was removed as it was unused
