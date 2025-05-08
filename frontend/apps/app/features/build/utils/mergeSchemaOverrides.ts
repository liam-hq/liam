import {
  type Schema,
  type SchemaOverride,
  overrideSchema,
} from '@liam-hq/db-structure'

/**
 * Merges multiple schema overrides according to priority
 * Overrides later in the array take precedence over earlier ones
 * 
 * @param schema Original schema
 * @param overrides Array of schema overrides to merge
 * @returns Merged schema and table groups
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
