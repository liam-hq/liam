import * as v from 'valibot'
import {
  type Schema,
  type Table,
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
type ColumnOverride = v.InferOutput<typeof columnOverrideSchema>

const tableOverrideSchema = v.object({
  comment: v.optional(v.nullable(v.string())),
  columns: v.optional(v.record(columnNameSchema, columnOverrideSchema)),
})
type TableOverride = v.InferOutput<typeof tableOverrideSchema>

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
 * Apply overrides to a column
 */
function applyColumnOverride(
  table: Table,
  columnName: string,
  columnOverride: ColumnOverride,
): void {
  if (!table.columns[columnName]) {
    throw new Error(
      `Cannot override non-existent column ${columnName} in table ${table.name}`,
    )
  }

  if (columnOverride.comment !== undefined) {
    table.columns[columnName].comment = columnOverride.comment
  }
}

/**
 * Apply overrides to a table
 */
function applyTableOverride(
  schema: Schema,
  tableName: string,
  tableOverride: TableOverride,
): void {
  if (!schema.tables[tableName]) {
    throw new Error(`Cannot override non-existent table: ${tableName}`)
  }

  // Override table comment if provided
  if (tableOverride.comment !== undefined) {
    schema.tables[tableName].comment = tableOverride.comment
  }

  // Apply column overrides if provided
  if (tableOverride.columns) {
    for (const [columnName, columnOverride] of Object.entries(
      tableOverride.columns,
    )) {
      applyColumnOverride(schema.tables[tableName], columnName, columnOverride)
    }
  }
}

/**
 * Process table groups
 */
function processTableGroups(
  schema: Schema,
  tableGroups: Record<string, TableGroup>,
  overrideTableGroups: Record<string, TableGroup>,
): Record<string, TableGroup> {
  const result = { ...tableGroups }

  for (const [groupName, groupDefinition] of Object.entries(
    overrideTableGroups,
  )) {
    // Validate tables exist
    for (const tableName of groupDefinition.tables) {
      if (!schema.tables[tableName]) {
        throw new Error(
          `Cannot add non-existent table ${tableName} to group ${groupName}`,
        )
      }
    }

    result[groupName] = groupDefinition
  }

  return result
}

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
  // Create a deep copy of the original schema
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
      applyTableOverride(result, tableName, tableOverride)
    }
  }

  // Process table groups
  if (overrides.tableGroups) {
    const updatedTableGroups = processTableGroups(
      result,
      tableGroups,
      overrides.tableGroups,
    )
    Object.assign(tableGroups, updatedTableGroups)
  }

  // Set table groups to the result schema
  result.tableGroups = tableGroups

  return { schema: result, tableGroups }
}
