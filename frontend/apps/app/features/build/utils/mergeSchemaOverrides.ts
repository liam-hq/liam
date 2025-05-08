import {
  type Schema,
  type SchemaOverride,
  overrideSchema,
} from '@liam-hq/db-structure'

/**
 * 複数のスキーマオーバーライドを優先順位に従ってマージする
 * 配列の後ろのオーバーライドが前のオーバーライドより優先される
 * 
 * @param schema 元のスキーマ
 * @param overrides マージするスキーマオーバーライドの配列
 * @returns マージされたスキーマとテーブルグループ
 */
export function mergeSchemaOverrides(
  schema: Schema,
  overrides: SchemaOverride[]
): { schema: Schema; tableGroups: Record<string, { name: string; tables: string[]; comment: string | null }> } {
  let result = {
    schema,
    tableGroups: schema.tableGroups || {},
  }
  
  for (const override of overrides) {
    result = overrideSchema(result.schema, override)
  }
  
  return result
}
