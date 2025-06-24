import * as v from 'valibot'
import {
  columnNameSchema,
  type Schema,
  schemaSchema,
  type Table,
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
 * Applies override definitions to the existing schema.
 * This function will:
 * 1. Apply overrides to existing tables (e.g., replacing comments)
 * 2. Apply overrides to existing columns (e.g., replacing comments)
 * @param originalSchema The original schema
 * @param override The override definitions
 * @returns The merged schema
 */
export function overrideSchema(
  originalSchema: Schema,
  override: SchemaOverride,
): Schema {
  // Create a deep copy of the original schema
  const result = v.parse(
    schemaSchema,
    JSON.parse(JSON.stringify(originalSchema)),
  )

  const { overrides } = override

  // Apply table overrides
  if (overrides.tables) {
    for (const [tableName, tableOverride] of Object.entries(overrides.tables)) {
      applyTableOverride(result, tableName, tableOverride)
    }
  }

  return result
}
