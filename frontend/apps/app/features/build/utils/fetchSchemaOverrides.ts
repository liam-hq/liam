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
export type SchemaOverrideSource = {
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
    type SourceItem = {
      id: string
      path: string
      description: string | null
    }

    const result = await supabase
      .from('schema_override_sources')
      .select('id, path, description')
      .eq('project_id', projectId)
      .order('priority', { ascending: false })

    if (!result || result.error) {
      console.error('Failed to fetch schema override sources:', result?.error)
      return []
    }

    const data = result.data as SourceItem[] | null

    return (data || [])
      .filter(
        (item): item is SourceItem =>
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
 * Retrieves schema override sources mapped to a specific branch or commit
 *
 * @param repositoryId Repository ID
 * @param branchOrCommit Branch or commit ID
 * @returns Array of override source definitions
 */
export async function getBranchSchemaOverrideSources(
  repositoryId: string,
  branchOrCommit: string,
): Promise<SchemaOverrideSource[]> {
  const supabase = await createClient()

  try {
    type MappingResult = {
      schema_override_source_id: string
      schema_override_sources: {
        id: string
        path: string
        description: string | null
      } | null
    }

    const query = supabase.from('branch_schema_override_mappings').select(`
        schema_override_source_id,
        schema_override_sources:schema_override_source_id (
          id,
          path,
          description
        )
      `)

    if (!query) {
      return []
    }

    const filteredQuery = query
      .eq('repository_id', repositoryId)
      .eq('branch_or_commit', branchOrCommit)
      .not('schema_override_source_id', 'is', null)

    if (!filteredQuery) {
      return []
    }

    const { data, error } = await filteredQuery

    if (error) {
      console.error('Failed to fetch branch schema override sources:', error)
      return []
    }

    const mappings = data as MappingResult[] | null

    return (mappings || [])
      .filter(
        (mapping) =>
          mapping?.schema_override_sources &&
          typeof mapping.schema_override_sources.id === 'string' &&
          typeof mapping.schema_override_sources.path === 'string',
      )
      .map((mapping) => {
        if (
          !mapping.schema_override_sources ||
          typeof mapping.schema_override_sources.id !== 'string' ||
          typeof mapping.schema_override_sources.path !== 'string'
        ) {
          return null
        }

        const source: SchemaOverrideSource = {
          id: mapping.schema_override_sources.id,
          path: mapping.schema_override_sources.path,
          description: mapping.schema_override_sources.description || undefined,
        }
        return source
      })
      .filter((source): source is SchemaOverrideSource => source !== null)
  } catch (error) {
    console.error('Error in getBranchSchemaOverrideSources:', error)
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
  _projectId: string, // Unused but kept for API consistency
  repositoryId: string,
  branchOrCommit: string,
  supabase: SupabaseClient,
): Promise<SchemaOverride | null> {
  try {
    type TableGroupMapping = {
      table_group_id: string
      table_groups: {
        id: string
        name: string
        tables: string[]
        comment: string | null
      } | null
    }

    type TableOverrideMapping = {
      table_override_id: string
      table_overrides: {
        id: string
        table_name: string
        comment: string | null
      } | null
    }

    const tableGroupsQuery = supabase
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

    if (!tableGroupsQuery) {
      return null
    }

    const filteredTableGroupsQuery = tableGroupsQuery
      .eq('repository_id', repositoryId)
      .eq('branch_or_commit', branchOrCommit)
      .not('table_group_id', 'is', null)

    if (!filteredTableGroupsQuery) {
      return null
    }

    const { data: tableGroupsData, error: tableGroupsError } =
      await filteredTableGroupsQuery

    if (tableGroupsError) {
      console.error('Failed to fetch table groups:', tableGroupsError)
      return null
    }

    // Fetch table overrides with the same pattern
    const tableOverridesQuery = supabase
      .from('branch_schema_override_mappings')
      .select(`
        table_override_id,
        table_overrides:table_override_id (
          id,
          table_name,
          comment
        )
      `)

    if (!tableOverridesQuery) {
      return null
    }

    const filteredTableOverridesQuery = tableOverridesQuery
      .eq('repository_id', repositoryId)
      .eq('branch_or_commit', branchOrCommit)
      .not('table_override_id', 'is', null)

    if (!filteredTableOverridesQuery) {
      return null
    }

    const { data: tableOverridesData, error: tableOverridesError } =
      await filteredTableOverridesQuery

    if (tableOverridesError) {
      console.error('Failed to fetch table overrides:', tableOverridesError)
      return null
    }

    const typedTableGroupsData = tableGroupsData as unknown as
      | TableGroupMapping[]
      | null
    const typedTableOverridesData = tableOverridesData as unknown as
      | TableOverrideMapping[]
      | null

    const tableGroups: Record<
      string,
      { name: string; tables: string[]; comment: string | null }
    > = {}
    const tableOverrides: Record<string, { comment?: string | null }> = {}

    if (typedTableGroupsData && Array.isArray(typedTableGroupsData)) {
      for (const mapping of typedTableGroupsData) {
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

    if (typedTableOverridesData && Array.isArray(typedTableOverridesData)) {
      for (const mapping of typedTableOverridesData) {
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

/**
 * Builds schema override for a project (without branch/commit specificity)
 *
 * @param projectId Project ID
 * @param supabase Supabase client
 * @returns Schema override
 */
export async function buildProjectSchemaOverrideFromDB(
  projectId: string,
  supabase: SupabaseClient,
): Promise<SchemaOverride | null> {
  try {
    type ProjectTableGroup = {
      name: string
      tables: string[]
      comment: string | null
    }

    type ProjectTableOverride = {
      table_name: string
      comment: string | null
    }

    // Fetch table groups
    const tableGroupsResult = await supabase
      .from('table_groups')
      .select('name, tables, comment')
      .eq('project_id', projectId)

    if (!tableGroupsResult || tableGroupsResult.error) {
      console.error(
        'Failed to fetch project table groups:',
        tableGroupsResult?.error,
      )
      return null
    }

    // Fetch table overrides
    const tableOverridesResult = await supabase
      .from('table_overrides')
      .select('table_name, comment')
      .eq('project_id', projectId)

    if (!tableOverridesResult || tableOverridesResult.error) {
      console.error(
        'Failed to fetch project table overrides:',
        tableOverridesResult?.error,
      )
      return null
    }

    const tableGroupsData = tableGroupsResult.data as ProjectTableGroup[] | null
    const tableOverridesData = tableOverridesResult.data as
      | ProjectTableOverride[]
      | null

    const tableGroups: Record<
      string,
      { name: string; tables: string[]; comment: string | null }
    > = {}
    const tableOverrides: Record<string, { comment?: string | null }> = {}

    if (tableGroupsData && Array.isArray(tableGroupsData)) {
      for (const group of tableGroupsData) {
        if (!group || typeof group.name !== 'string') continue

        tableGroups[group.name] = {
          name: group.name,
          tables: Array.isArray(group.tables) ? group.tables : [],
          comment: group.comment || null,
        }
      }
    }

    if (tableOverridesData && Array.isArray(tableOverridesData)) {
      for (const override of tableOverridesData) {
        if (!override || typeof override.table_name !== 'string') continue

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
    console.error('Failed to build project schema override from DB:', error)
    return null
  }
}

/**
 * Saves a table group to the database
 *
 * @param projectId Project ID
 * @param tableGroup Table group to save
 * @param supabase Supabase client
 * @returns The saved table group ID
 */
export async function saveTableGroup(
  projectId: string,
  tableGroup: { name: string; tables: string[]; comment: string | null },
  supabase: SupabaseClient,
): Promise<string | null> {
  try {
    const result = await supabase
      .from('table_groups')
      .upsert({
        project_id: projectId,
        name: tableGroup.name,
        tables: tableGroup.tables,
        comment: tableGroup.comment,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (!result || result.error) {
      console.error('Failed to save table group:', result?.error)
      return null
    }

    return result.data?.id || null
  } catch (error) {
    console.error('Failed to save table group:', error)
    return null
  }
}

/**
 * Saves a table override to the database
 *
 * @param projectId Project ID
 * @param tableName Table name
 * @param override Table override to save
 * @param supabase Supabase client
 * @returns The saved table override ID
 */
export async function saveTableOverride(
  projectId: string,
  tableName: string,
  override: { comment?: string | null },
  supabase: SupabaseClient,
): Promise<string | null> {
  try {
    const result = await supabase
      .from('table_overrides')
      .upsert({
        project_id: projectId,
        table_name: tableName,
        comment: override.comment,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (!result || result.error) {
      console.error('Failed to save table override:', result?.error)
      return null
    }

    return result.data?.id || null
  } catch (error) {
    console.error('Failed to save table override:', error)
    return null
  }
}

/**
 * Maps a schema override to a branch or commit
 *
 * @param repositoryId Repository ID
 * @param branchOrCommit Branch or commit ID
 * @param schemaOverride Schema override to map
 * @param projectId Project ID
 * @param supabase Supabase client
 * @returns Whether the mapping was successful
 */
export async function mapSchemaOverrideToBranchOrCommit(
  repositoryId: string,
  branchOrCommit: string,
  schemaOverride: SchemaOverride,
  projectId: string,
  supabase: SupabaseClient,
): Promise<boolean> {
  try {
    if (schemaOverride.overrides.tableGroups) {
      for (const [name, group] of Object.entries(
        schemaOverride.overrides.tableGroups,
      )) {
        const tableGroupId = await saveTableGroup(
          projectId,
          { ...group, name },
          supabase,
        )
        if (tableGroupId) {
          const result = await supabase
            .from('branch_schema_override_mappings')
            .upsert({
              repository_id: repositoryId,
              branch_or_commit: branchOrCommit,
              table_group_id: tableGroupId,
              updated_at: new Date().toISOString(),
            })

          if (result?.error) {
            console.error(
              'Failed to map table group to branch/commit:',
              result.error,
            )
          }
        }
      }
    }

    if (schemaOverride.overrides.tables) {
      for (const [tableName, override] of Object.entries(
        schemaOverride.overrides.tables,
      )) {
        const tableOverrideId = await saveTableOverride(
          projectId,
          tableName,
          override,
          supabase,
        )
        if (tableOverrideId) {
          const result = await supabase
            .from('branch_schema_override_mappings')
            .upsert({
              repository_id: repositoryId,
              branch_or_commit: branchOrCommit,
              table_override_id: tableOverrideId,
              updated_at: new Date().toISOString(),
            })

          if (result?.error) {
            console.error(
              'Failed to map table override to branch/commit:',
              result.error,
            )
          }
        }
      }
    }

    return true
  } catch (error) {
    console.error('Failed to map schema override to branch/commit:', error)
    return false
  }
}
