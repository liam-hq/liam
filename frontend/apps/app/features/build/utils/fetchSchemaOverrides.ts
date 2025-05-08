import { createClient } from '@/libs/db/server'
import {
  type Schema,
  type SchemaOverride,
  schemaOverrideSchema,
} from '@liam-hq/db-structure'
import { getFileContent } from '@liam-hq/github'
import { type SupabaseClient } from '@supabase/supabase-js'
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
  overrideSources: SchemaOverrideSource[]
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

      const parsedOverride = schemaOverrideSchema.parse(
        parseYaml(content)
      )
      
      overrides.push(parsedOverride)
    } catch (error) {
      console.error(`Failed to fetch schema override from ${source.path}:`, error)
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
  projectId: string
): Promise<SchemaOverrideSource[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('schema_override_sources')
    .select('id, path, description')
    .eq('project_id', projectId)
    .order('priority', { ascending: false })

  if (error) {
    console.error('Failed to fetch schema override sources:', error)
    return []
  }

  return data || []
}

/**
 * Builds schema override directly from DB items
 * 
 * @param projectId Project ID
 * @param supabase Supabase client
 * @returns Schema override
 */
export async function buildSchemaOverrideFromDB(
  projectId: string,
  supabase: SupabaseClient
): Promise<SchemaOverride | null> {
  try {
    const { data: tableGroupsData, error: tableGroupsError } = await supabase
      .from('table_groups')
      .select('name, tables, comment')
      .eq('project_id', projectId)

    if (tableGroupsError) throw tableGroupsError

    const { data: tableOverridesData, error: tableOverridesError } = await supabase
      .from('table_overrides')
      .select('table_name, comment')
      .eq('project_id', projectId)

    if (tableOverridesError) throw tableOverridesError

    const tableGroups: Record<string, { name: string; tables: string[]; comment: string | null }> = {}
    const tableOverrides: Record<string, { comment?: string | null }> = {}

    tableGroupsData?.forEach(group => {
      if (group.name) {
        tableGroups[group.name] = {
          name: group.name,
          tables: Array.isArray(group.tables) ? group.tables : [],
          comment: group.comment || null,
        }
      }
    })

    tableOverridesData?.forEach(override => {
      if (override.table_name) {
        tableOverrides[override.table_name] = {
          comment: override.comment || null,
        }
      }
    })

    return {
      overrides: {
        tableGroups,
        tables: tableOverrides,
      }
    }
  } catch (error) {
    console.error('Failed to build schema override from DB:', error)
    return null
  }
}
