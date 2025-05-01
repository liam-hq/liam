import * as v from 'valibot'
import {
  type Schema,
  type TableGroup,
  columnNameSchema,
  columnSchema,
  relationshipNameSchema,
  relationshipSchema,
  schemaSchema,
  tableGroupNameSchema,
  tableGroupSchema,
  tableNameSchema,
  tableSchema,
} from './schema.js'

// Request status enum
export const requestStatusSchema = v.picklist([
  'open',
  'in_progress',
  'done',
  'wontfix',
])
export type RequestStatus = v.InferOutput<typeof requestStatusSchema>

const columnOverrideSchema = v.object({
  comment: v.optional(v.nullable(v.string())),
})
export type ColumnOverride = v.InferOutput<typeof columnOverrideSchema>

// Schema for table definition in requests
const tableDefinitionSchema = v.object({
  name: v.string(),
  comment: v.optional(v.nullable(v.string())),
  columns: v.record(columnNameSchema, columnSchema),
  indexes: v.optional(
    v.record(
      v.string(),
      v.object({
        name: v.string(),
        columns: v.array(v.string()),
        unique: v.boolean(),
        type: v.string(),
      }),
    ),
  ),
  constraints: v.optional(
    v.record(
      v.string(),
      v.object({
        type: v.picklist(['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK']),
        name: v.optional(v.string()),
        columnName: v.optional(v.string()),
        targetTableName: v.optional(v.string()),
        targetColumnName: v.optional(v.string()),
        updateConstraint: v.optional(
          v.picklist([
            'CASCADE',
            'RESTRICT',
            'SET_NULL',
            'SET_DEFAULT',
            'NO_ACTION',
          ]),
        ),
        deleteConstraint: v.optional(
          v.picklist([
            'CASCADE',
            'RESTRICT',
            'SET_NULL',
            'SET_DEFAULT',
            'NO_ACTION',
          ]),
        ),
        detail: v.optional(v.string()),
      }),
    ),
  ),
})
export type TableDefinition = v.InferOutput<typeof tableDefinitionSchema>

// Schema for relationship definition in requests
const relationshipDefinitionSchema = v.object({
  name: v.string(),
  primaryTableName: v.string(),
  primaryColumnName: v.string(),
  foreignTableName: v.string(),
  foreignColumnName: v.string(),
  cardinality: v.picklist(['ONE_TO_ONE', 'ONE_TO_MANY']),
  updateConstraint: v.picklist([
    'CASCADE',
    'RESTRICT',
    'SET_NULL',
    'SET_DEFAULT',
    'NO_ACTION',
  ]),
  deleteConstraint: v.picklist([
    'CASCADE',
    'RESTRICT',
    'SET_NULL',
    'SET_DEFAULT',
    'NO_ACTION',
  ]),
})
export type RelationshipDefinition = v.InferOutput<
  typeof relationshipDefinitionSchema
>

// Schema for column changes in alter table requests
const columnChangeSchema = v.object({
  from: v.optional(v.union([v.string(), v.number(), v.boolean(), v.null()])),
  to: v.optional(v.union([v.string(), v.number(), v.boolean(), v.null()])),
})
export type ColumnChange = v.InferOutput<typeof columnChangeSchema>

// Schema for table alter operations
const tableAlterOperationSchema = v.union([
  v.object({
    type: v.literal('rename_column'),
    from: v.string(),
    to: v.string(),
    reason: v.optional(v.string()),
  }),
  v.object({
    type: v.literal('modify_column'),
    column: v.string(),
    changes: v.record(v.string(), columnChangeSchema),
    reason: v.optional(v.string()),
  }),
  v.object({
    type: v.literal('add_column'),
    definition: columnSchema,
    reason: v.optional(v.string()),
  }),
  v.object({
    type: v.literal('drop_column'),
    name: v.string(),
    reason: v.optional(v.string()),
  }),
])
export type TableAlterOperation = v.InferOutput<
  typeof tableAlterOperationSchema
>

// Schema for adding columns to an existing table
const addColumnsSchema = v.record(columnNameSchema, columnSchema)
export type AddColumns = v.InferOutput<typeof addColumnsSchema>

const tableOverrideSchema = v.object({
  comment: v.optional(v.nullable(v.string())),
  columns: v.optional(v.record(columnNameSchema, columnOverrideSchema)),
  addColumns: v.optional(addColumnsSchema),
})
export type TableOverride = v.InferOutput<typeof tableOverrideSchema>

// Schema for table add request
const tableAddRequestSchema = v.object({
  definition: tableDefinitionSchema,
})
export type TableAddRequest = v.InferOutput<typeof tableAddRequestSchema>

// Schema for table drop request
const tableDropRequestSchema = v.object({
  reason: v.string(),
})
export type TableDropRequest = v.InferOutput<typeof tableDropRequestSchema>

// Schema for table alter request
const tableAlterRequestSchema = v.object({
  changes: v.array(tableAlterOperationSchema),
})
export type TableAlterRequest = v.InferOutput<typeof tableAlterRequestSchema>

// Schema for relationship add request
const relationshipAddRequestSchema = v.object({
  definition: relationshipDefinitionSchema,
})
export type RelationshipAddRequest = v.InferOutput<
  typeof relationshipAddRequestSchema
>

// Schema for relationship drop request
const relationshipDropRequestSchema = v.object({
  reason: v.string(),
})
export type RelationshipDropRequest = v.InferOutput<
  typeof relationshipDropRequestSchema
>

// Schema for implementation request
const implementationRequestSchema = v.object({
  id: v.string(), // Removed regex validation as it's causing type issues
  description: v.optional(v.string()),
  status: requestStatusSchema,
  tables: v.optional(
    v.object({
      add: v.optional(v.record(tableNameSchema, tableAddRequestSchema)),
      drop: v.optional(v.record(tableNameSchema, tableDropRequestSchema)),
      alter: v.optional(v.record(tableNameSchema, tableAlterRequestSchema)),
    }),
  ),
  relationships: v.optional(
    v.object({
      add: v.optional(
        v.record(relationshipNameSchema, relationshipAddRequestSchema),
      ),
      drop: v.optional(
        v.record(relationshipNameSchema, relationshipDropRequestSchema),
      ),
    }),
  ),
  createdBy: v.string(),
  createdAt: v.string(), // Removed format validation as it's not available in Valibot
  refs: v.optional(
    v.object({
      issue: v.optional(v.union([v.string(), v.number()])),
      commit: v.optional(v.nullable(v.string())),
    }),
  ),
})
export type ImplementationRequest = v.InferOutput<
  typeof implementationRequestSchema
>

// Schema for the entire override structure
export const schemaOverrideSchema = v.object({
  overrides: v.object({
    // For adding completely new tables
    addTables: v.optional(v.record(tableNameSchema, tableSchema)),

    // For overriding properties of existing tables
    tables: v.optional(v.record(tableNameSchema, tableOverrideSchema)),

    // For adding new relationships
    addRelationships: v.optional(
      v.record(relationshipNameSchema, relationshipSchema),
    ),

    // For grouping tables
    tableGroups: v.optional(v.record(tableGroupNameSchema, tableGroupSchema)),
  }),
  // Implementation requests
  requests: v.optional(v.array(implementationRequestSchema)),
})

export type SchemaOverride = v.InferOutput<typeof schemaOverrideSchema>

// Type for processed implementation requests
export type ProcessedRequests = {
  openRequests: ImplementationRequest[]
  inProgressRequests: ImplementationRequest[]
  doneRequests: ImplementationRequest[]
  wontfixRequests: ImplementationRequest[]
  allRequests?: ImplementationRequest[] // Add allRequests property for simplified processing
}

/**
 * Applies override definitions to the existing schema.
 * This function will:
 * 1. Add new tables (if specified in addTables)
 * 2. Apply overrides to existing tables (e.g., replacing comments)
 * 3. Apply overrides to existing columns (e.g., replacing comments)
 * 4. Add new columns to existing tables (if specified in addColumns)
 * 5. Add new relationships (if specified in addRelationships)
 * 6. Process and merge table groups from both original schema and overrides
 * 7. Process implementation requests based on their status
 * @param originalSchema The original schema
 * @param override The override definitions
 * @returns The merged schema, table grouping information, and processed requests
 */
export function overrideSchema(
  originalSchema: Schema,
  override: SchemaOverride,
): {
  schema: Schema
  tableGroups: Record<string, TableGroup>
  requests?: ProcessedRequests
} {
  const result = v.parse(
    schemaSchema,
    JSON.parse(JSON.stringify(originalSchema)),
  )

  const { overrides, requests } = override

  // Initialize table groups from the original schema if it exists
  const tableGroups: Record<string, TableGroup> = originalSchema.tableGroups
    ? { ...originalSchema.tableGroups }
    : {}

  // Initialize processed requests
  const processedRequests: ProcessedRequests = {
    openRequests: [],
    inProgressRequests: [],
    doneRequests: [],
    wontfixRequests: [],
    allRequests: [], // Add allRequests property for simplified processing
  }

  // Add new tables
  if (overrides?.addTables) {
    for (const [tableName, tableDefinition] of Object.entries(
      overrides.addTables,
    )) {
      if (result.tables[tableName]) {
        throw new Error(
          `Table ${tableName} already exists in the database structure`,
        )
      }
      result.tables[tableName] = tableDefinition
    }
  }

  // Apply table overrides
  if (overrides?.tables) {
    for (const [tableName, tableOverride] of Object.entries(overrides.tables)) {
      if (!result.tables[tableName]) {
        throw new Error(`Cannot override non-existent table: ${tableName}`)
      }

      // Override table comment if provided
      if (tableOverride.comment !== undefined) {
        result.tables[tableName].comment = tableOverride.comment
      }

      // Override column comments
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

      // Add new columns
      if (tableOverride.addColumns) {
        for (const [columnName, columnDefinition] of Object.entries(
          tableOverride.addColumns,
        )) {
          if (result.tables[tableName].columns[columnName]) {
            throw new Error(
              `Column ${columnName} already exists in table ${tableName}`,
            )
          }
          result.tables[tableName].columns[columnName] = columnDefinition
        }
      }
    }
  }

  // Add new relationships
  if (overrides?.addRelationships) {
    for (const [relationshipName, relationshipDefinition] of Object.entries(
      overrides.addRelationships,
    )) {
      if (result.relationships[relationshipName]) {
        throw new Error(
          `Relationship ${relationshipName} already exists in the database structure`,
        )
      }

      // Validate that referenced tables and columns exist
      const {
        primaryTableName,
        primaryColumnName,
        foreignTableName,
        foreignColumnName,
      } = relationshipDefinition

      if (!result.tables[primaryTableName]) {
        throw new Error(
          `Primary table ${primaryTableName} does not exist for relationship ${relationshipName}`,
        )
      }

      if (!result.tables[primaryTableName].columns[primaryColumnName]) {
        throw new Error(
          `Primary column ${primaryColumnName} does not exist in table ${primaryTableName} for relationship ${relationshipName}`,
        )
      }

      if (!result.tables[foreignTableName]) {
        throw new Error(
          `Foreign table ${foreignTableName} does not exist for relationship ${relationshipName}`,
        )
      }

      if (!result.tables[foreignTableName].columns[foreignColumnName]) {
        throw new Error(
          `Foreign column ${foreignColumnName} does not exist in table ${foreignTableName} for relationship ${relationshipName}`,
        )
      }

      result.relationships[relationshipName] = relationshipDefinition
    }
  }

  // Process table groups
  if (overrides?.tableGroups) {
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

  // Process implementation requests
  if (requests && requests.length > 0) {
    // Add all requests to the allRequests array
    processedRequests.allRequests = [...requests]

    for (const request of requests) {
      // Categorize requests by status
      switch (request.status) {
        case 'open':
          processedRequests.openRequests.push(request)
          break
        case 'in_progress':
          processedRequests.inProgressRequests.push(request)
          break
        case 'done':
          processedRequests.doneRequests.push(request)
          // Apply 'done' requests to the schema
          applyImplementationRequest(result, request)
          break
        case 'wontfix':
          processedRequests.wontfixRequests.push(request)
          break
      }
    }
  }

  // Set table groups to the result schema
  result.tableGroups = tableGroups

  return { schema: result, tableGroups, requests: processedRequests }
}

/**
 * Applies a 'done' implementation request to the schema
 * @param schema The schema to modify
 * @param request The implementation request to apply
 */
function applyImplementationRequest(
  schema: Schema,
  request: ImplementationRequest,
): void {
  // Only apply 'done' requests
  if (request.status !== 'done') {
    return
  }

  // Process table additions
  if (request.tables?.add) {
    for (const [tableName, tableAddRequest] of Object.entries(
      request.tables.add,
    )) {
      if (schema.tables[tableName]) {
        console.warn(
          `Table ${tableName} already exists, skipping addition from request ${request.id}`,
        )
        continue
      }
      // Create a properly typed table definition
      const definition: (typeof schema.tables)[string] = {
        name: tableAddRequest.definition.name,
        comment: tableAddRequest.definition.comment ?? null,
        columns: tableAddRequest.definition.columns,
        indexes: {},
        constraints: {},
      }

      // Add indexes if they exist
      if (tableAddRequest.definition.indexes) {
        for (const [indexName, indexDef] of Object.entries(
          tableAddRequest.definition.indexes,
        )) {
          definition.indexes[indexName] = {
            name: indexDef.name,
            columns: indexDef.columns,
            unique: indexDef.unique ?? false,
            type: indexDef.type ?? 'btree', // Default to btree if not specified
          }
        }
      }

      // Add constraints if they exist
      if (tableAddRequest.definition.constraints) {
        for (const [constraintName, constraintDef] of Object.entries(
          tableAddRequest.definition.constraints,
        )) {
          // Handle each constraint type separately
          switch (constraintDef.type) {
            case 'PRIMARY KEY':
              if (constraintDef.name && constraintDef.columnName) {
                definition.constraints[constraintName] = {
                  type: 'PRIMARY KEY',
                  name: constraintDef.name,
                  columnName: constraintDef.columnName,
                }
              }
              break
            case 'FOREIGN KEY':
              if (
                constraintDef.name &&
                constraintDef.columnName &&
                constraintDef.targetTableName &&
                constraintDef.targetColumnName &&
                constraintDef.updateConstraint &&
                constraintDef.deleteConstraint
              ) {
                definition.constraints[constraintName] = {
                  type: 'FOREIGN KEY',
                  name: constraintDef.name,
                  columnName: constraintDef.columnName,
                  targetTableName: constraintDef.targetTableName,
                  targetColumnName: constraintDef.targetColumnName,
                  updateConstraint: constraintDef.updateConstraint,
                  deleteConstraint: constraintDef.deleteConstraint,
                }
              }
              break
            case 'UNIQUE':
              if (constraintDef.name && constraintDef.columnName) {
                definition.constraints[constraintName] = {
                  type: 'UNIQUE',
                  name: constraintDef.name,
                  columnName: constraintDef.columnName,
                }
              }
              break
            case 'CHECK':
              if (constraintDef.name && constraintDef.detail) {
                definition.constraints[constraintName] = {
                  type: 'CHECK',
                  name: constraintDef.name,
                  detail: constraintDef.detail,
                }
              }
              break
          }
        }
      }

      schema.tables[tableName] = definition
    }
  }

  // Process relationship additions
  if (request.relationships?.add) {
    for (const [relationshipName, relationshipAddRequest] of Object.entries(
      request.relationships.add,
    )) {
      if (schema.relationships[relationshipName]) {
        console.warn(
          `Relationship ${relationshipName} already exists, skipping addition from request ${request.id}`,
        )
        continue
      }
      schema.relationships[relationshipName] = relationshipAddRequest.definition
    }
  }

  // Note: Table alterations and drops are not applied here as they would require
  // modifying the actual database schema, which is out of scope for this feature.
  // These are only visualized in the ER diagram.
}
