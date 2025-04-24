import * as v from 'valibot'
import {
  type Schema,
  type TableGroup,
  columnNameSchema,
  schemaSchema,
  tableGroupNameSchema,
  tableGroupSchema,
  tableNameSchema,
} from './schema.js'

const columnOverrideSchema = v.object({
  comment: v.optional(v.nullable(v.string())),
})
export type ColumnOverride = v.InferOutput<typeof columnOverrideSchema>

const tableOverrideSchema = v.object({
  comment: v.optional(v.nullable(v.string())),
  columns: v.optional(v.record(columnNameSchema, columnOverrideSchema)),
})
export type TableOverride = v.InferOutput<typeof tableOverrideSchema>

// Schema for the entire override structure
export const schemaOverrideSchema = v.object({
  overrides: v.object({
    // For overriding properties of existing tables
    tables: v.optional(v.record(tableNameSchema, tableOverrideSchema)),

    // For grouping tables
    tableGroups: v.optional(v.record(tableGroupNameSchema, tableGroupSchema)),
  }),
})

export type SchemaOverride = v.InferOutput<typeof schemaOverrideSchema>

/**
 * Applies override definitions to the existing schema.
 * This function will:
 * 1. Apply overrides to existing tables (e.g., replacing comments)
 * 2. Apply overrides to existing columns (e.g., replacing comments)
 * 3. Process and merge table groups from both original schema and overrides
 * @param originalSchema The original schema
 * @param override The override definitions
 * @returns The merged schema and table grouping information
 */
export function overrideSchema(
  originalSchema: Schema,
  override: SchemaOverride,
): { schema: Schema; tableGroups: Record<string, TableGroup> } {
  const result = v.parse(
    schemaSchema,
    JSON.parse(JSON.stringify(originalSchema)),
  )

  const { overrides } = override

  // Initialize table groups from the original schema if it exists
  const tableGroups: Record<string, TableGroup> = originalSchema.tableGroups
    ? { ...originalSchema.tableGroups }
    : {}

  // Apply table overrides
  if (overrides.tables) {
    for (const [tableName, tableOverride] of Object.entries(overrides.tables)) {
      if (!result.tables[tableName]) {
        throw new Error(`Cannot override non-existent table: ${tableName}`)
      }

      // Override table comment if provided
      if (tableOverride.comment !== undefined) {
        result.tables[tableName].comment = tableOverride.comment
      }

      if (tableOverride.columns) {
        for (const [columnName, columnOverride] of Object.entries(
          tableOverride.columns,
        )) {
          if (!result.tables[tableName].columns[columnName]) {
            throw new Error(
              `Cannot override non-existent column ${columnName} in table ${tableName}`,
            )
          }

          if (columnOverride.comment !== undefined) {
            result.tables[tableName].columns[columnName].comment =
              columnOverride.comment
          }
        }
      }
    }
  }

  // Process table groups
  if (overrides.tableGroups) {
    for (const [groupName, groupDefinition] of Object.entries(
      overrides.tableGroups,
    )) {
      // Validate tables exist
      for (const tableName of groupDefinition.tables) {
        if (!result.tables[tableName]) {
          throw new Error(
            `Cannot add non-existent table ${tableName} to group ${groupName}`,
          )
        }
      }

      tableGroups[groupName] = groupDefinition
    }
  }

  // Set table groups to the result schema
  result.tableGroups = tableGroups

  return { schema: result, tableGroups }
}
