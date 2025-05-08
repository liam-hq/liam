import { createClient } from '@/libs/db/server'
import type { SupabaseClient } from '@/libs/db/server'
import type { SchemaOverride } from '@liam-hq/db-structure'
import {
  buildSchemaOverrideFromDB,
  fetchSchemaOverrides,
  getSchemaOverrideSources,
} from './fetchSchemaOverrides'

/**
 * Gets all schema overrides for a specific branch or commit
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

/**
 * Checks if a branch or commit has any schema overrides
 *
 * @param repositoryId Repository ID
 * @param branchOrCommit Branch or commit ID
 * @param supabase Supabase client
 * @returns Whether the branch/commit has any schema overrides
 */
export async function hasBranchSchemaOverrides(
  repositoryId: string,
  branchOrCommit: string,
  supabase: SupabaseClient,
): Promise<boolean> {
  try {
    const query = supabase
      .from('branch_schema_override_mappings')
      .select('id', { count: 'exact', head: true })

    if (!query) {
      return false
    }

    const filteredQuery = query
      .eq('repository_id', repositoryId)
      .eq('branch_or_commit', branchOrCommit)

    if (!filteredQuery) {
      return false
    }

    const { error, count } = await filteredQuery

    if (error) {
      console.error('Failed to check if branch has schema overrides:', error)
      return false
    }

    return typeof count === 'number' && count > 0
  } catch (error) {
    console.error('Failed to check if branch has schema overrides:', error)
    return false
  }
}
