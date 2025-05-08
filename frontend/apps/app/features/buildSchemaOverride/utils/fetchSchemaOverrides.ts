import { createClient } from '@/libs/db/server'
import type { SupabaseClient } from '@/libs/db/server'
import {
  type SchemaOverride,
  schemaOverrideSchema,
} from '@liam-hq/db-structure'
import { getFileContent } from '@liam-hq/github'
import { parse as parseYaml } from 'yaml'

/**
 * Schema override source definition
 */
type SchemaOverrideSource = {
  id: string
  path: string
  description?: string
}

/**
 * Fetches schema overrides from specified sources
 *
 * @param repositoryFullName Repository full name (owner/repo)
 * @param branchOrCommit Branch or commit ID
 * @param githubInstallationIdentifier GitHub installation ID
 * @param overrideSources Array of override source definitions
 * @returns Array of retrieved schema overrides
 */
export async function fetchSchemaOverrides(
  repositoryFullName: string,
  branchOrCommit: string,
  githubInstallationIdentifier: number,
  overrideSources: SchemaOverrideSource[],
): Promise<SchemaOverride[]> {
  const overrides: SchemaOverride[] = []

  for (const source of overrideSources) {
    try {
      const { content } = await getFileContent(
        repositoryFullName,
        source.path,
        branchOrCommit,
        githubInstallationIdentifier,
      )

      if (content === null) continue

      const parsedYaml = parseYaml(content)
      let parsedOverride: SchemaOverride | null = null

      try {
        if (
          schemaOverrideSchema &&
          typeof schemaOverrideSchema === 'object' &&
          'parse' in schemaOverrideSchema &&
          typeof schemaOverrideSchema.parse === 'function'
        ) {
          parsedOverride = schemaOverrideSchema.parse(parsedYaml)
        }
      } catch (parseError) {
        console.error(
          `Failed to parse schema override from ${source.path}:`,
          parseError,
        )
        continue
      }

      if (!parsedOverride) continue

      overrides.push(parsedOverride)
    } catch (error) {
      console.error(
        `Failed to fetch schema override from ${source.path}:`,
        error,
      )
    }
  }

  return overrides
}

/**
 * Retrieves schema override source information from DB tables
 *
 * @param projectId Project ID
 * @returns Array of override source definitions
 */
export async function getSchemaOverrideSources(
  projectId: string,
): Promise<SchemaOverrideSource[]> {
  const supabase = await createClient()

  try {
    const result = await supabase
      .from('schema_override_sources')
      .select('id, path, description')
      .eq('project_id', projectId)
      .order('priority', { ascending: false })

    if (!result || result.error) {
      console.error('Failed to fetch schema override sources:', result?.error)
      return []
    }

    return (result.data || [])
      .filter(
        (item) =>
          !!item &&
          typeof item.id === 'string' &&
          typeof item.path === 'string',
      )
      .map((item) => ({
        id: item.id,
        path: item.path,
        description: item.description || undefined,
      }))
  } catch (error) {
    console.error('Error in getSchemaOverrideSources:', error)
    return []
  }
}

/**
 * Builds schema override directly from DB items
 *
 * @param projectId Project ID
 * @param repositoryId Repository ID
 * @param branchOrCommit Branch or commit ID
 * @param supabase Supabase client
 * @returns Schema override
 */
export async function buildSchemaOverrideFromDB(
  _projectId: string,
  repositoryId: string,
  branchOrCommit: string,
  supabase: SupabaseClient,
): Promise<SchemaOverride | null> {
  try {
    // Fetch table groups
    const { data: tableGroupsData, error: tableGroupsError } = await supabase
      .from('branch_schema_override_mappings')
      .select(`
        table_group_id,
        table_groups:table_group_id (
          id,
          name,
          tables,
          comment
        )
      `)
      .eq('repository_id', repositoryId)
      .eq('branch_or_commit', branchOrCommit)
      .not('table_group_id', 'is', null)

    if (tableGroupsError) {
      console.error('Failed to fetch table groups:', tableGroupsError)
      return null
    }

    // Fetch table overrides
    const { data: tableOverridesData, error: tableOverridesError } =
      await supabase
        .from('branch_schema_override_mappings')
        .select(`
        table_override_id,
        table_overrides:table_override_id (
          id,
          table_name,
          comment
        )
      `)
        .eq('repository_id', repositoryId)
        .eq('branch_or_commit', branchOrCommit)
        .not('table_override_id', 'is', null)

    if (tableOverridesError) {
      console.error('Failed to fetch table overrides:', tableOverridesError)
      return null
    }

    const tableGroups: Record<
      string,
      { name: string; tables: string[]; comment: string | null }
    > = {}
    const tableOverrides: Record<string, { comment?: string | null }> = {}

    // Process table groups
    if (tableGroupsData && Array.isArray(tableGroupsData)) {
      for (const mapping of tableGroupsData) {
        if (!mapping || !mapping.table_groups) continue

        const group = mapping.table_groups
        if (typeof group.name !== 'string') continue

        tableGroups[group.name] = {
          name: group.name,
          tables: Array.isArray(group.tables) ? group.tables : [],
          comment: group.comment || null,
        }
      }
    }

    // Process table overrides
    if (tableOverridesData && Array.isArray(tableOverridesData)) {
      for (const mapping of tableOverridesData) {
        if (!mapping || !mapping.table_overrides) continue

        const override = mapping.table_overrides
        if (typeof override.table_name !== 'string') continue

        tableOverrides[override.table_name] = {
          comment: override.comment || null,
        }
      }
    }

    return {
      overrides: {
        tableGroups,
        tables: tableOverrides,
      },
    }
  } catch (error) {
    console.error('Failed to build schema override from DB:', error)
    return null
  }
}
