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
 * スキーマオーバーライドのソース定義
 */
export type SchemaOverrideSource = {
  id: string
  path: string
  description?: string
}

/**
 * 指定されたソースからスキーマオーバーライドを取得する
 * 
 * @param repositoryFullName リポジトリのフルネーム（owner/repo）
 * @param branchOrCommit ブランチまたはコミットID
 * @param githubInstallationIdentifier GitHubインストールID
 * @param overrideSources オーバーライドソース定義の配列
 * @returns 取得したスキーマオーバーライドの配列
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
 * DBテーブルからスキーマオーバーライドソース情報を取得する
 * 
 * @param projectId プロジェクトID
 * @returns オーバーライドソース定義の配列
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
 * DB項目から直接スキーマオーバーライドを構築する
 * 
 * @param projectId プロジェクトID
 * @returns スキーマオーバーライド
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
