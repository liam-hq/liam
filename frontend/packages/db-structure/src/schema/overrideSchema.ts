import * as v from 'valibot'
import {
  type Schema,
  type Table,
  type TableGroup,
  columnNameSchema,
  columnSchema,
  constraintSchema,
  indexSchema,
  schemaSchema,
  tableGroupNameSchema,
  tableGroupSchema,
  tableNameSchema,
  tableSchema,
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

// New schema for table definition in addTable operation
const addTableColumnSchema = columnSchema
export type AddTableColumn = v.InferOutput<typeof addTableColumnSchema>

const addTableSchema = v.object({
  name: tableNameSchema,
  columns: v.record(columnNameSchema, addTableColumnSchema),
  comment: v.nullable(v.string()),
  indexes: v.optional(v.record(v.string(), indexSchema), {}),
  constraints: v.optional(v.record(v.string(), constraintSchema), {}),
})
export type AddTable = v.InferOutput<typeof addTableSchema>

// Operation schemas
const addTableOperationSchema = v.object({
  type: v.literal('addTable'),
  table: addTableSchema,
})
export type AddTableOperation = v.InferOutput<typeof addTableOperationSchema>

const deleteTableOperationSchema = v.object({
  type: v.literal('deleteTable'),
  tableName: tableNameSchema,
})
export type DeleteTableOperation = v.InferOutput<
  typeof deleteTableOperationSchema
>

// Union of all operation types
const operationSchema = v.union([
  addTableOperationSchema,
  deleteTableOperationSchema,
])
export type Operation = v.InferOutput<typeof operationSchema>

// Schema for the entire override structure
export const schemaOverrideSchema = v.object({
  overrides: v.object({
    // For overriding properties of existing tables
    tables: v.optional(v.record(tableNameSchema, tableOverrideSchema)),

    // For grouping tables
    tableGroups: v.optional(v.record(tableGroupNameSchema, tableGroupSchema)),

    // For operations that modify schema structure
    operations: v.optional(v.array(operationSchema)),
  }),
})

export type SchemaOverride = v.InferOutput<typeof schemaOverrideSchema>

/**
 * Applies override definitions to the existing schema.
 * This function will:
 * 1. Apply overrides to existing tables (e.g., replacing comments)
 * 2. Apply overrides to existing columns (e.g., replacing comments)
 * 3. Process and merge table groups from both original schema and overrides
 * 4. Apply structure-modifying operations like adding or deleting tables
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

  // Apply operations first (addTable, deleteTable, etc.)
  if (overrides.operations) {
    for (const operation of overrides.operations) {
      switch (operation.type) {
        case 'addTable': {
          const { table } = operation
          // Validate table doesn't already exist
          if (result.tables[table.name]) {
            throw new Error(`Table already exists: ${table.name}`)
          }

          // Add the new table to the schema
          const validatedTable = v.parse(tableSchema, table) as Table
          result.tables[table.name] = validatedTable
          break
        }
        case 'deleteTable': {
          const { tableName } = operation
          // Validate table exists
          if (!result.tables[tableName]) {
            throw new Error(`Cannot delete non-existent table: ${tableName}`)
          }

          // Check for any relationships involving this table and delete them
          const relationshipsToDelete: string[] = []
          for (const [relationshipName, relationship] of Object.entries(
            result.relationships,
          )) {
            if (
              relationship.primaryTableName === tableName ||
              relationship.foreignTableName === tableName
            ) {
              relationshipsToDelete.push(relationshipName)
            }
          }

          // Delete the relationships
          for (const relationshipName of relationshipsToDelete) {
            delete result.relationships[relationshipName]
          }

          // Remove the table from any table groups
          for (const groupName in result.tableGroups) {
            result.tableGroups[groupName].tables = result.tableGroups[
              groupName
            ].tables.filter((name) => name !== tableName)
          }
          
          // Also update the tableGroups variable that will be returned
          for (const groupName in tableGroups) {
            tableGroups[groupName].tables = tableGroups[
              groupName
            ].tables.filter((name) => name !== tableName)
          }

          // Delete the table
          delete result.tables[tableName]
          break
        }
      }
    }
  }

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
