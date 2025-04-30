import type {
  Column,
  Relationships,
  Schema,
  Table,
  TableGroup,
} from '@liam-hq/db-structure'
import { schemaSchema } from '@liam-hq/db-structure'
import { parse } from 'valibot'

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
    // Extract JSON blocks from the AI response
    const jsonBlocks = extractJsonBlocks(message)
    if (jsonBlocks.length === 0) {
      return { schema: currentSchema, modified: false }
    }

    // Process each JSON block
    for (const jsonBlock of jsonBlocks) {
      try {
        const schemaModification = JSON.parse(jsonBlock)

        // Merge schema changes with current schema
        const updatedSchema = mergeSchemaChanges(
          currentSchema,
          schemaModification,
        )

        // Ensure the schema is valid before applying changes
        try {
          // Validate schema against schemaSchema
          parse(schemaSchema, updatedSchema)

          // If validation passes, return updated schema
          return { schema: updatedSchema, modified: true }
        } catch (validationError) {
          console.error('Schema validation error:', validationError)
          // Try next JSON block if available
        }
      } catch (e) {
        // Log error and continue to next JSON block
        console.error('Failed to process schema modification:', e)
        // Skip to next iteration
      }
    }

    // If all JSON blocks fail to process
    return {
      schema: currentSchema,
      modified: false,
      error: 'No valid schema modifications found',
    }
  } catch (e) {
    return {
      schema: currentSchema,
      modified: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

/**
 * Extract JSON blocks from an AI response message
 * @param message - AI response message
 * @returns Array of extracted JSON strings
 */
function extractJsonBlocks(message: string): string[] {
  const blocks: string[] = []

  // Extract JSON from code blocks (```json ... ```)
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g
  let match: RegExpExecArray | null

  // Use a different approach to avoid assignment in expression
  match = codeBlockRegex.exec(message)
  while (match !== null) {
    blocks.push(match[1].trim())
    match = codeBlockRegex.exec(message)
  }

  // Extract JSON from [SCHEMA_JSON] ... [/SCHEMA_JSON] format
  const schemaJsonRegex = /\[SCHEMA_JSON\]([\s\S]*?)\[\/SCHEMA_JSON\]/g
  match = schemaJsonRegex.exec(message)
  while (match !== null) {
    blocks.push(match[1].trim())
    match = schemaJsonRegex.exec(message)
  }

  return blocks
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
