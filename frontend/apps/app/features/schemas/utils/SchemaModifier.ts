import type {
  Column,
  Relationships,
  Schema,
  Table,
  TableGroup,
} from '@liam-hq/db-structure'
import { schemaSchema } from '@liam-hq/db-structure'
import { safeParse } from 'valibot'

/**
 * Result of processing schema modifications
 */
export interface SchemaModificationResult {
  schema: Schema
  modified: boolean
  error?: string
}

/**
 * Process AI response to extract and apply schema modifications
 * @param message - AI response message containing potential schema modifications
 * @param currentSchema - Current schema to be modified
 * @returns Object containing modified schema, modification status, and any errors
 */
export function processSchemaModification(
  message: string,
  currentSchema: Schema,
): SchemaModificationResult {
  try {
    // Try to extract JSON from the message - it might be wrapped in markdown code blocks
    let jsonContent = message

    // Extract JSON from code blocks if present
    const jsonCodeBlockMatch = message.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonCodeBlockMatch?.[1]) {
      jsonContent = jsonCodeBlockMatch[1]
    }

    // Parse the JSON
    try {
      const schemaModification = JSON.parse(jsonContent)

      // Merge schema changes with current schema
      const updatedSchema = mergeSchemaChanges(
        currentSchema,
        schemaModification,
      )

      // Validate schema against schemaSchema using safeParse
      const result = safeParse(schemaSchema, updatedSchema)

      if (result.success) {
        // If validation passes, return updated schema
        return { schema: updatedSchema, modified: true }
      }

      // Handle validation error
      console.error('Schema validation error:', result.issues)

      // Format the validation issues
      const details = Array.isArray(result.issues)
        ? result.issues
            .map((issue) => {
              // Handle path formatting carefully
              const path = Array.isArray(issue.path)
                ? issue.path.map((segment) => String(segment)).join('.')
                : 'unknown-path'
              return `${path} ${issue.message || 'is invalid'}`
            })
            .join('; ')
        : 'Validation issues present'

      return {
        schema: currentSchema,
        modified: false,
        error: `Validation failed: ${details}`,
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return {
        schema: currentSchema,
        modified: false,
        error: `Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
      }
    }
  } catch (e) {
    // Handle any other unexpected errors
    console.error('Failed to process schema modification:', e)

    return {
      schema: currentSchema,
      modified: false,
      error: `Processing error: ${e instanceof Error ? e.message : JSON.stringify(e)}`,
    }
  }

  // All execution paths above should return a value, so this code should never be reached
}

/**
 * Merge partial schema changes into the current schema
 * @param currentSchema - Current schema
 * @param changes - Partial schema changes to apply
 * @returns Updated schema with changes applied
 */
function mergeSchemaChanges(
  currentSchema: Schema,
  changes: Partial<Schema>,
): Schema {
  // Create deep copy of current schema
  const newSchema = JSON.parse(JSON.stringify(currentSchema)) as Schema

  // Merge table changes
  if (changes.tables) {
    // Ensure each table has the required properties
    const processedTables: Record<string, Table> = {}

    for (const [tableName, tableData] of Object.entries(changes.tables || {})) {
      if (tableData) {
        // Check if the table already exists in the current schema
        const existingTable = currentSchema.tables[tableName]

        // Initialize the table (copy existing table if it exists, or create new one)
        const processedTable: Table = existingTable
          ? JSON.parse(JSON.stringify(existingTable))
          : {
              name: tableName,
              columns: {},
              comment: tableData.comment ?? null,
              indexes: {},
              constraints: {},
            }

        // Update comment if provided
        if (tableData.comment !== undefined) {
          processedTable.comment = tableData.comment
        }

        // Merge indexes if provided (keeping existing indexes)
        if (tableData.indexes) {
          processedTable.indexes = {
            ...processedTable.indexes,
            ...tableData.indexes,
          }
        }

        // Merge constraints if provided (keeping existing constraints)
        if (tableData.constraints) {
          processedTable.constraints = {
            ...processedTable.constraints,
            ...tableData.constraints,
          }
        }

        // Process columns to ensure they have name property
        if (tableData.columns) {
          // Start with existing columns to preserve them
          const processedColumns: Record<string, Column> = {
            ...processedTable.columns,
          }

          for (const [columnName, columnObj] of Object.entries(
            tableData.columns,
          )) {
            // Need to ensure columnObj is treated as a proper object
            const columnData = columnObj as Partial<Column>

            processedColumns[columnName] = {
              name: columnName, // Ensure the name property is set
              type: columnData.type || 'text',
              default: columnData.default ?? null,
              check: columnData.check ?? null,
              primary: columnData.primary ?? false,
              unique: columnData.unique ?? false,
              notNull: columnData.notNull ?? false,
              comment: columnData.comment ?? null,
            }
          }

          processedTable.columns = processedColumns
        }

        processedTables[tableName] = processedTable
      }
    }

    newSchema.tables = {
      ...newSchema.tables,
      ...processedTables,
    }
  }

  // Merge relationship changes
  if (changes.relationships) {
    // Check if existing relationships need to be preserved
    const existingRelationships = newSchema.relationships || {}

    // Process relationships from changes
    const processedRelationships: Relationships = {}

    for (const [relationshipName, relationshipObj] of Object.entries(
      changes.relationships || {},
    )) {
      if (relationshipObj) {
        // Create type-safe relationship data
        const relationshipData = relationshipObj as Record<string, unknown>

        // Extract properties with proper type checking
        processedRelationships[relationshipName] = {
          name: relationshipName,
          primaryTableName: (relationshipData.primaryTableName as string) || '',
          primaryColumnName:
            (relationshipData.primaryColumnName as string) || '',
          foreignTableName: (relationshipData.foreignTableName as string) || '',
          foreignColumnName:
            (relationshipData.foreignColumnName as string) || '',
          cardinality:
            (relationshipData.cardinality as 'ONE_TO_ONE' | 'ONE_TO_MANY') ||
            'ONE_TO_MANY',
          updateConstraint:
            (relationshipData.updateConstraint as
              | 'CASCADE'
              | 'RESTRICT'
              | 'SET_NULL'
              | 'SET_DEFAULT'
              | 'NO_ACTION') || 'NO_ACTION',
          deleteConstraint:
            (relationshipData.deleteConstraint as
              | 'CASCADE'
              | 'RESTRICT'
              | 'SET_NULL'
              | 'SET_DEFAULT'
              | 'NO_ACTION') || 'NO_ACTION',
        }
      }
    }

    // Merge existing relationships with the new ones
    newSchema.relationships = {
      ...existingRelationships,
      ...processedRelationships,
    }
  }

  // Merge table group changes
  if (changes.tableGroups) {
    // Ensure each table group has the required properties
    const processedTableGroups: Record<string, TableGroup> = {}

    for (const [groupName, groupObj] of Object.entries(
      changes.tableGroups || {},
    )) {
      if (groupObj) {
        // Need to ensure groupObj is treated as a proper object
        const groupData = groupObj as Partial<TableGroup>

        // Ensure table group has name property
        processedTableGroups[groupName] = {
          name: groupData.name || groupName, // Ensure the name property is set
          tables: groupData.tables || [],
          comment: groupData.comment ?? null,
        }
      }
    }

    newSchema.tableGroups = {
      ...newSchema.tableGroups,
      ...processedTableGroups,
    }
  }

  return newSchema
}
