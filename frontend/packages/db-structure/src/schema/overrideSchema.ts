import * as v from 'valibot'
import {
  type Column,
  type Schema,
  type Table,
  type TableGroup,
  columnNameSchema,
  columnSchema,
  constraintNameSchema,
  constraintSchema,
  indexSchema,
  relationshipNameSchema,
  relationshipSchema,
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

// Table operation schemas
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

// Schema for changing table name operation
const changeTableSchema = v.object({
  oldTableName: tableNameSchema,
  newTableName: tableNameSchema,
})
export type ChangeTable = v.InferOutput<typeof changeTableSchema>

const changeTableOperationSchema = v.object({
  type: v.literal('changeTable'),
  changeTable: changeTableSchema,
})
export type ChangeTableOperation = v.InferOutput<typeof changeTableOperationSchema>

// Column operation schemas
const addColumnSchema = columnSchema
export type AddColumn = v.InferOutput<typeof addColumnSchema>

const addColumnOperationSchema = v.object({
  type: v.literal('addColumn'),
  tableName: tableNameSchema,
  columnName: columnNameSchema,
  column: addColumnSchema,
})
export type AddColumnOperation = v.InferOutput<typeof addColumnOperationSchema>

const deleteColumnOperationSchema = v.object({
  type: v.literal('deleteColumn'),
  tableName: tableNameSchema,
  columnName: columnNameSchema,
})
export type DeleteColumnOperation = v.InferOutput<
  typeof deleteColumnOperationSchema
>

// Schema for changing column name operation
const changeColumnSchema = v.object({
  tableName: tableNameSchema,
  oldColumnName: columnNameSchema,
  newColumnName: columnNameSchema,
})
export type ChangeColumn = v.InferOutput<typeof changeColumnSchema>

const changeColumnOperationSchema = v.object({
  type: v.literal('changeColumn'),
  changeColumn: changeColumnSchema,
})
export type ChangeColumnOperation = v.InferOutput<typeof changeColumnOperationSchema>

// Define schema for updating a column with partial properties
const updateColumnPropertiesSchema = v.partial(
  v.pick(columnSchema, [
    'type',
    'default',
    'check',
    'primary',
    'unique',
    'notNull',
    'comment',
  ]),
)
export type UpdateColumnProperties = v.InferOutput<
  typeof updateColumnPropertiesSchema
>

const updateColumnOperationSchema = v.object({
  type: v.literal('updateColumn'),
  tableName: tableNameSchema,
  columnName: columnNameSchema,
  properties: updateColumnPropertiesSchema,
})
export type UpdateColumnOperation = v.InferOutput<
  typeof updateColumnOperationSchema
>

// Index operation schemas
const addIndexSchema = indexSchema
export type AddIndex = v.InferOutput<typeof addIndexSchema>

const addIndexOperationSchema = v.object({
  type: v.literal('addIndex'),
  tableName: tableNameSchema,
  indexName: v.string(),
  index: addIndexSchema,
})
export type AddIndexOperation = v.InferOutput<typeof addIndexOperationSchema>

const deleteIndexOperationSchema = v.object({
  type: v.literal('deleteIndex'),
  tableName: tableNameSchema,
  indexName: v.string(),
})
export type DeleteIndexOperation = v.InferOutput<
  typeof deleteIndexOperationSchema
>

// Constraint operation schemas
const addConstraintSchema = constraintSchema
export type AddConstraint = v.InferOutput<typeof addConstraintSchema>

const addConstraintOperationSchema = v.object({
  type: v.literal('addConstraint'),
  tableName: tableNameSchema,
  constraintName: constraintNameSchema,
  constraint: addConstraintSchema,
})
export type AddConstraintOperation = v.InferOutput<
  typeof addConstraintOperationSchema
>

const deleteConstraintOperationSchema = v.object({
  type: v.literal('deleteConstraint'),
  tableName: tableNameSchema,
  constraintName: constraintNameSchema,
})
export type DeleteConstraintOperation = v.InferOutput<
  typeof deleteConstraintOperationSchema
>

// Relationship operation schemas
const addRelationshipSchema = relationshipSchema
export type AddRelationship = v.InferOutput<typeof addRelationshipSchema>

const addRelationshipOperationSchema = v.object({
  type: v.literal('addRelationship'),
  relationshipName: relationshipNameSchema,
  relationship: addRelationshipSchema,
})
export type AddRelationshipOperation = v.InferOutput<
  typeof addRelationshipOperationSchema
>

const deleteRelationshipOperationSchema = v.object({
  type: v.literal('deleteRelationship'),
  relationshipName: relationshipNameSchema,
})
export type DeleteRelationshipOperation = v.InferOutput<
  typeof deleteRelationshipOperationSchema
>

// Union of all operation types
export const operationSchema = v.union([
  addTableOperationSchema,
  deleteTableOperationSchema,
  changeTableOperationSchema,
  addColumnOperationSchema,
  deleteColumnOperationSchema,
  changeColumnOperationSchema,
  updateColumnOperationSchema,
  addIndexOperationSchema,
  deleteIndexOperationSchema,
  addConstraintOperationSchema,
  deleteConstraintOperationSchema,
  addRelationshipOperationSchema,
  deleteRelationshipOperationSchema,
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
            if (result.tableGroups[groupName]?.tables) {
              result.tableGroups[groupName].tables = result.tableGroups[
                groupName
              ].tables.filter((name) => name !== tableName)
            }
          }

          // Also update the tableGroups variable that will be returned
          for (const groupName in tableGroups) {
            if (tableGroups[groupName]?.tables) {
              tableGroups[groupName].tables = tableGroups[
                groupName
              ].tables.filter((name) => name !== tableName)
            }
          }

          // Delete the table
          delete result.tables[tableName]
          break
        }
        case 'changeTable': {
          const { changeTable } = operation
          const { oldTableName, newTableName } = changeTable
          
          // Validate old table exists
          if (!result.tables[oldTableName]) {
            throw new Error(`Cannot rename non-existent table: ${oldTableName}`)
          }
          
          // Validate new table name doesn't already exist
          if (result.tables[newTableName]) {
            throw new Error(`Cannot rename to existing table: ${newTableName}`)
          }
          
          // Copy the table with the new name
          result.tables[newTableName] = {
            ...result.tables[oldTableName],
            name: newTableName,
          }
          
          // Update any relationships that reference this table
          for (const [relationshipName, relationship] of Object.entries(
            result.relationships,
          )) {
            if (relationship.primaryTableName === oldTableName) {
              result.relationships[relationshipName] = {
                ...relationship,
                primaryTableName: newTableName,
              }
            }
            if (relationship.foreignTableName === oldTableName) {
              result.relationships[relationshipName] = {
                ...relationship,
                foreignTableName: newTableName,
              }
            }
          }
          
          // Update any table groups that reference this table
          for (const groupName in result.tableGroups) {
            if (result.tableGroups[groupName]?.tables) {
              result.tableGroups[groupName].tables = result.tableGroups[
                groupName
              ].tables.map((name) => (name === oldTableName ? newTableName : name))
            }
          }
          
          // Also update the tableGroups variable that will be returned
          for (const groupName in tableGroups) {
            if (tableGroups[groupName]?.tables) {
              tableGroups[groupName].tables = tableGroups[
                groupName
              ].tables.map((name) => (name === oldTableName ? newTableName : name))
            }
          }
          
          // Delete the old table
          delete result.tables[oldTableName]
          break
        }
        case 'addColumn': {
          const { tableName, columnName, column } = operation
          // Validate table exists
          if (!result.tables[tableName]) {
            throw new Error(
              `Cannot add column to non-existent table: ${tableName}`,
            )
          }

          // Validate column doesn't already exist
          if (result.tables[tableName].columns[columnName]) {
            throw new Error(
              `Column already exists: ${columnName} in table ${tableName}`,
            )
          }

          // Add the new column to the table
          const validatedColumn = v.parse(columnSchema, column) as Column
          result.tables[tableName].columns[columnName] = validatedColumn
          break
        }
        case 'deleteColumn': {
          const { tableName, columnName } = operation
          // Validate table exists
          if (!result.tables[tableName]) {
            throw new Error(
              `Cannot delete column from non-existent table: ${tableName}`,
            )
          }

          // Validate column exists
          if (!result.tables[tableName].columns[columnName]) {
            throw new Error(
              `Cannot delete non-existent column: ${columnName} from table ${tableName}`,
            )
          }

          // Check for any relationships involving this column
          const relationshipsToDelete: string[] = []
          for (const [relationshipName, relationship] of Object.entries(
            result.relationships,
          )) {
            if (
              (relationship.primaryTableName === tableName &&
                relationship.primaryColumnName === columnName) ||
              (relationship.foreignTableName === tableName &&
                relationship.foreignColumnName === columnName)
            ) {
              relationshipsToDelete.push(relationshipName)
            }
          }

          // Delete the relationships
          for (const relationshipName of relationshipsToDelete) {
            delete result.relationships[relationshipName]
          }

          // Check if the column is used in any indexes and remove it
          for (const indexName in result.tables[tableName].indexes) {
            const index = result.tables[tableName].indexes[indexName]
            if (index?.columns.includes(columnName)) {
              // If index uses only this column, delete the entire index
              if (index.columns.length === 1) {
                delete result.tables[tableName].indexes[indexName]
              } else {
                // Otherwise, remove the column from the index
                index.columns = index.columns.filter(
                  (col) => col !== columnName,
                )
              }
            }
          }

          // Check if the column is used in any constraints and remove them
          const constraintsToDelete: string[] = []
          for (const [constraintName, constraint] of Object.entries(
            result.tables[tableName].constraints,
          )) {
            if (
              'columnName' in constraint &&
              constraint.columnName === columnName
            ) {
              constraintsToDelete.push(constraintName)
            }
          }

          // Delete the constraints
          for (const constraintName of constraintsToDelete) {
            delete result.tables[tableName].constraints[constraintName]
          }

          // Delete the column
          delete result.tables[tableName].columns[columnName]
          break
        }
        case 'changeColumn': {
          const { changeColumn } = operation
          const { tableName, oldColumnName, newColumnName } = changeColumn
          
          // Validate table exists
          if (!result.tables[tableName]) {
            throw new Error(
              `Cannot rename column in non-existent table: ${tableName}`,
            )
          }
          
          // Validate old column exists
          if (!result.tables[tableName].columns[oldColumnName]) {
            throw new Error(
              `Cannot rename non-existent column: ${oldColumnName} in table ${tableName}`,
            )
          }
          
          // Validate new column name doesn't already exist
          if (result.tables[tableName].columns[newColumnName]) {
            throw new Error(
              `Cannot rename to existing column: ${newColumnName} in table ${tableName}`,
            )
          }
          
          // Copy column with new name
          result.tables[tableName].columns[newColumnName] = {
            ...result.tables[tableName].columns[oldColumnName],
            name: newColumnName,
          }
          
          // Update any relationships that reference this column
          for (const [relationshipName, relationship] of Object.entries(
            result.relationships,
          )) {
            if (
              relationship.primaryTableName === tableName &&
              relationship.primaryColumnName === oldColumnName
            ) {
              result.relationships[relationshipName] = {
                ...relationship,
                primaryColumnName: newColumnName,
              }
            }
            if (
              relationship.foreignTableName === tableName &&
              relationship.foreignColumnName === oldColumnName
            ) {
              result.relationships[relationshipName] = {
                ...relationship,
                foreignColumnName: newColumnName,
              }
            }
          }
          
          // Update any indexes that reference this column
          for (const indexName in result.tables[tableName].indexes) {
            const index = result.tables[tableName].indexes[indexName]
            if (index?.columns.includes(oldColumnName)) {
              index.columns = index.columns.map((col) =>
                col === oldColumnName ? newColumnName : col,
              )
            }
          }
          
          // Update any constraints that reference this column
          for (const [constraintName, constraint] of Object.entries(
            result.tables[tableName].constraints,
          )) {
            if (
              'columnName' in constraint &&
              constraint.columnName === oldColumnName
            ) {
              // This is a type assertion to handle the fact that columnName might not exist on all constraint types
              (result.tables[tableName].constraints[constraintName] as any).columnName = newColumnName
            }
          }
          
          // Delete the old column
          delete result.tables[tableName].columns[oldColumnName]
          break
        }
        case 'updateColumn': {
          const { tableName, columnName, properties } = operation
          // Validate table exists
          if (!result.tables[tableName]) {
            throw new Error(
              `Cannot update column in non-existent table: ${tableName}`,
            )
          }

          // Validate column exists
          if (!result.tables[tableName].columns[columnName]) {
            throw new Error(
              `Cannot update non-existent column: ${columnName} in table ${tableName}`,
            )
          }

          // Update column properties
          for (const [key, value] of Object.entries(properties)) {
            if (value !== undefined) {
              // Need to use Record<string, unknown> type here for dynamic property access
              ;(
                result.tables[tableName].columns[columnName] as Record<
                  string,
                  unknown
                >
              )[key] = value
            }
          }

          break
        }
        case 'addIndex': {
          const { tableName, indexName, index } = operation
          // Validate table exists
          if (!result.tables[tableName]) {
            throw new Error(
              `Cannot add index to non-existent table: ${tableName}`,
            )
          }

          // Validate index doesn't already exist
          if (result.tables[tableName].indexes[indexName]) {
            throw new Error(
              `Index already exists: ${indexName} in table ${tableName}`,
            )
          }

          // Validate that all columns in the index exist in the table
          if (index?.columns) {
            for (const columnName of index.columns) {
              if (!result.tables[tableName].columns[columnName]) {
                throw new Error(
                  `Cannot create index with non-existent column: ${columnName} in table ${tableName}`,
                )
              }
            }
          }

          // Add the new index to the table
          result.tables[tableName].indexes[indexName] = index
          break
        }
        case 'deleteIndex': {
          const { tableName, indexName } = operation
          // Validate table exists
          if (!result.tables[tableName]) {
            throw new Error(
              `Cannot delete index from non-existent table: ${tableName}`,
            )
          }

          // Validate index exists
          if (!result.tables[tableName].indexes[indexName]) {
            throw new Error(
              `Cannot delete non-existent index: ${indexName} from table ${tableName}`,
            )
          }

          // Delete the index
          delete result.tables[tableName].indexes[indexName]
          break
        }
        case 'addConstraint': {
          const { tableName, constraintName, constraint } = operation
          // Validate table exists
          if (!result.tables[tableName]) {
            throw new Error(
              `Cannot add constraint to non-existent table: ${tableName}`,
            )
          }

          // Validate constraint doesn't already exist
          if (result.tables[tableName].constraints[constraintName]) {
            throw new Error(
              `Constraint already exists: ${constraintName} in table ${tableName}`,
            )
          }

          // Additional validations based on constraint type
          if ('columnName' in constraint) {
            // For PRIMARY KEY, FOREIGN KEY, and UNIQUE constraints that reference a column
            if (!result.tables[tableName].columns[constraint.columnName]) {
              throw new Error(
                `Cannot create constraint for non-existent column: ${constraint.columnName} in table ${tableName}`,
              )
            }

            // Additional validation for FOREIGN KEY constraints
            if (constraint.type === 'FOREIGN KEY') {
              // Check that the target table exists
              if (!result.tables[constraint.targetTableName]) {
                throw new Error(
                  `Foreign key target table does not exist: ${constraint.targetTableName}`,
                )
              }

              // Check that the target column exists in the target table
              const targetTable = result.tables[constraint.targetTableName]
              if (
                targetTable &&
                !targetTable.columns[constraint.targetColumnName]
              ) {
                throw new Error(
                  `Foreign key target column does not exist: ${constraint.targetColumnName} in table ${constraint.targetTableName}`,
                )
              }
            }
          }

          // Add the new constraint to the table
          result.tables[tableName].constraints[constraintName] = constraint
          break
        }
        case 'deleteConstraint': {
          const { tableName, constraintName } = operation
          // Validate table exists
          if (!result.tables[tableName]) {
            throw new Error(
              `Cannot delete constraint from non-existent table: ${tableName}`,
            )
          }

          // Validate constraint exists
          if (!result.tables[tableName].constraints[constraintName]) {
            throw new Error(
              `Cannot delete non-existent constraint: ${constraintName} from table ${tableName}`,
            )
          }

          // Delete the constraint
          delete result.tables[tableName].constraints[constraintName]
          break
        }
        case 'addRelationship': {
          const { relationshipName, relationship } = operation
          // Validate relationship doesn't already exist
          if (result.relationships[relationshipName]) {
            throw new Error(`Relationship already exists: ${relationshipName}`)
          }

          // Validate primary table exists
          if (!result.tables[relationship.primaryTableName]) {
            throw new Error(
              `Primary table does not exist: ${relationship.primaryTableName}`,
            )
          }

          // Validate foreign table exists
          if (!result.tables[relationship.foreignTableName]) {
            throw new Error(
              `Foreign table does not exist: ${relationship.foreignTableName}`,
            )
          }

          // Validate primary column exists in primary table
          const primaryTable = result.tables[relationship.primaryTableName]
          if (
            primaryTable &&
            !primaryTable.columns[relationship.primaryColumnName]
          ) {
            throw new Error(
              `Primary column does not exist: ${relationship.primaryColumnName} in table ${relationship.primaryTableName}`,
            )
          }

          // Validate foreign column exists in foreign table
          const foreignTable = result.tables[relationship.foreignTableName]
          if (
            foreignTable &&
            !foreignTable.columns[relationship.foreignColumnName]
          ) {
            throw new Error(
              `Foreign column does not exist: ${relationship.foreignColumnName} in table ${relationship.foreignTableName}`,
            )
          }

          // Add the new relationship
          result.relationships[relationshipName] = relationship
          break
        }
        case 'deleteRelationship': {
          const { relationshipName } = operation
          // Validate relationship exists
          if (!result.relationships[relationshipName]) {
            throw new Error(
              `Cannot delete non-existent relationship: ${relationshipName}`,
            )
          }

          // Delete the relationship
          delete result.relationships[relationshipName]
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
