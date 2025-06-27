import type { DMMF } from '@prisma/generator-helper'
import pkg from '@prisma/internals'
import type {
  Columns,
  Constraints,
  ForeignKeyConstraint,
  ForeignKeyConstraintReferenceOption,
  Index,
  Table,
} from '../../schema/index.js'
import type { Processor, ProcessResult } from '../types.js'
import { convertToPostgresColumnType } from './convertToPostgresColumnType.js'

// NOTE: Workaround for CommonJS module import issue with @prisma/internals
// CommonJS module can not support all module.exports as named exports
const { getDMMF } = pkg

const getFieldRenamedIndex = (
  index: DMMF.Index,
  tableFieldsRenaming: Record<string, Record<string, string>>,
): DMMF.Index => {
  const fieldsRenaming = tableFieldsRenaming[index.model]
  if (!fieldsRenaming) return index
  const newFields = index.fields.map((field) => ({
    ...field,
    name: fieldsRenaming[field.name] ?? field.name,
  }))
  return { ...index, fields: newFields }
}

/**
 * Build a mapping of field renamings from model fields
 */
function buildFieldRenamingMap(
  models: readonly DMMF.Model[],
): Record<string, Record<string, string>> {
  const tableFieldRenaming: Record<string, Record<string, string>> = {}

  for (const model of models) {
    for (const field of model.fields) {
      if (field.dbName) {
        const tableName = model.dbName || model.name
        const fieldConversions = tableFieldRenaming[tableName] ?? {}
        fieldConversions[field.name] = field.dbName
        tableFieldRenaming[tableName] = fieldConversions
      }
    }
  }

  return tableFieldRenaming
}

/**
 * Process a model field and create a column
 */
import type { Column } from '../../schema/index.js'

function processModelField(
  field: DMMF.Field,
  model: DMMF.Model,
  tableFieldRenaming: Record<string, Record<string, string>>,
): {
  column: [string, Column] | null
  constraint: [string, Constraints[string]] | null
} {
  if (field.relationName) return { column: null, constraint: null }

  const defaultValue = extractDefaultValue(field)

  const fieldName =
    tableFieldRenaming[model.dbName || model.name]?.[field.name] ?? field.name

  const column = {
    name: fieldName,
    type: convertToPostgresColumnType(
      field.type,
      field.nativeType,
      defaultValue,
    ),
    default: defaultValue,
    notNull: field.isRequired,
    comment: field.documentation ?? null,
    check: null,
  }

  let constraint = null

  if (field.isId) {
    const constraintName = `PRIMARY_${fieldName}`
    constraint = {
      type: 'PRIMARY KEY' as const,
      name: constraintName,
      columnName: fieldName,
    }
  } else if (field.isUnique) {
    // to avoid duplicate with PRIMARY KEY constraint, it doesn't create constraint object with `field.isId`
    const constraintName = `UNIQUE_${fieldName}`
    constraint = {
      type: 'UNIQUE' as const,
      name: constraintName,
      columnName: fieldName,
    }
  }

  return {
    column: [fieldName, column],
    constraint: constraint ? [constraint.name, constraint] : null,
  }
}

/**
 * Process a model and create a table
 */
function processModel(
  model: DMMF.Model,
  tableFieldRenaming: Record<string, Record<string, string>>,
): Table {
  const columns: Columns = {}
  const constraints: Constraints = {}

  for (const field of model.fields) {
    const { column, constraint } = processModelField(
      field,
      model,
      tableFieldRenaming,
    )

    if (column) {
      columns[column[0]] = column[1]
    }

    if (constraint) {
      constraints[constraint[0]] = constraint[1]
    }
  }

  return {
    name: model.dbName || model.name,
    columns,
    comment: model.documentation ?? null,
    indexes: {},
    constraints,
  }
}

/**
 * Process all models and create tables
 */
function processTables(
  models: readonly DMMF.Model[],
  tableFieldRenaming: Record<string, Record<string, string>>,
): Record<string, Table> {
  const tables: Record<string, Table> = {}

  for (const model of models) {
    tables[model.dbName || model.name] = processModel(model, tableFieldRenaming)
  }

  return tables
}

/**
 * Get Primary Table Name
 */

function getPrimaryTableNameByType(
  fieldType: string,
  models: readonly DMMF.Model[],
) {
  return models.find((model) => model.name === fieldType)?.dbName ?? fieldType
}

/**
 * Process a relationship field and create foreign key constraint
 */
function processRelationshipField(
  field: DMMF.Field,
  model: DMMF.Model,
  models: readonly DMMF.Model[],
  tableFieldRenaming: Record<string, Record<string, string>>,
): ForeignKeyConstraint | null {
  if (!field.relationName) return null

  const isTargetField =
    field.relationToFields?.[0] &&
    (field.relationToFields?.length ?? 0) > 0 &&
    field.relationFromFields?.[0] &&
    (field.relationFromFields?.length ?? 0) > 0

  if (!isTargetField) return null

  // Get the primary table name
  const primaryTableName = getPrimaryTableNameByType(field.type, models)

  // Get the column names
  const primaryColumnName = field.relationToFields?.[0] ?? ''
  const foreignColumnName = field.relationFromFields?.[0] ?? ''

  // Apply field renaming
  const foreignTableName = model.dbName || model.name
  const mappedPrimaryColumnName =
    tableFieldRenaming[primaryTableName]?.[primaryColumnName] ||
    primaryColumnName
  const mappedForeignColumnName =
    tableFieldRenaming[foreignTableName]?.[foreignColumnName] ||
    foreignColumnName

  const constraint: ForeignKeyConstraint = {
    type: 'FOREIGN KEY',
    name: field.relationName,
    columnName: mappedForeignColumnName,
    targetTableName: primaryTableName,
    targetColumnName: mappedPrimaryColumnName,
    updateConstraint: 'NO_ACTION',
    deleteConstraint: normalizeConstraintName(field.relationOnDelete ?? ''),
  }

  return constraint
}

/**
 * Process a single model's foreign key constraints
 */
function processModelConstraints(
  model: DMMF.Model,
  models: readonly DMMF.Model[],
  tables: Record<string, Table>,
  tableFieldRenaming: Record<string, Record<string, string>>,
  processedManyToManyRelations: Set<string>,
  manyToManyRelations: Array<{
    model1: string
    model2: string
    field1: DMMF.Field
    field2: DMMF.Field
  }>,
): void {
  for (const field of model.fields) {
    if (!field.relationName) continue

    // Skip many-to-many relations as they're handled separately
    if (
      detectAndStoreManyToManyRelation(
        field,
        model,
        models,
        processedManyToManyRelations,
        manyToManyRelations,
      )
    ) {
      continue
    }

    // Process foreign key constraint
    const constraint = processRelationshipField(
      field,
      model,
      models,
      tableFieldRenaming,
    )

    // Add constraint to table
    if (constraint) {
      const tableName = model.dbName || model.name
      const table = tables[tableName]
      if (table) {
        table.constraints[constraint.name] = constraint
      }
    }
  }
}

/**
 * Process constraints for all models
 */
function processConstraints(
  models: readonly DMMF.Model[],
  tables: Record<string, Table>,
  tableFieldRenaming: Record<string, Record<string, string>>,
  processedManyToManyRelations: Set<string>,
  manyToManyRelations: Array<{
    model1: string
    model2: string
    field1: DMMF.Field
    field2: DMMF.Field
  }>,
): void {
  // Process each model's constraints
  for (const model of models) {
    processModelConstraints(
      model,
      models,
      tables,
      tableFieldRenaming,
      processedManyToManyRelations,
      manyToManyRelations,
    )
  }
}

/**
 * Process indexes for all models
 */
function processIndexes(
  indexes: readonly DMMF.Index[],
  models: readonly DMMF.Model[],
  tables: Record<string, Table>,
  tableFieldRenaming: Record<string, Record<string, string>>,
): void {
  const updatedIndexes = indexes.map((index) => {
    const model = models.find((m) => m.name === index.model)
    return model
      ? {
          model: model.dbName ?? model.name,
          type: index.type,
          isDefinedOnField: index.isDefinedOnField,
          fields: index.fields,
        }
      : index
  })

  for (const index of updatedIndexes) {
    const table = tables[index.model]
    if (!table) continue

    const indexInfo = extractIndex(
      getFieldRenamedIndex(index, tableFieldRenaming),
    )
    if (!indexInfo) continue

    table.indexes[indexInfo.name] = indexInfo
  }
}

/**
 * Process many-to-many relationships and create join tables with constraints
 */
function processManyToManyRelationships(
  manyToManyRelations: Array<{
    model1: string
    model2: string
    field1: DMMF.Field
    field2: DMMF.Field
  }>,
  tables: Record<string, Table>,
  models: readonly DMMF.Model[],
): void {
  for (const relation of manyToManyRelations) {
    const table_A = tables[relation.model1]
    const table_B = tables[relation.model2]

    // Skip if both tables are undefined
    if (table_A === undefined && table_B === undefined) continue

    // Get primary key info for model1 if table_A exists
    const model1PrimaryKeyInfo = table_A
      ? getPrimaryKeyInfo(table_A, models)
      : null

    // Get primary key info for model2 if table_B exists
    const model2PrimaryKeyInfo = table_B
      ? getPrimaryKeyInfo(table_B, models)
      : null

    if (model1PrimaryKeyInfo && model2PrimaryKeyInfo) {
      const model1PrimaryKeyColumnType = convertToPostgresColumnType(
        model1PrimaryKeyInfo.type,
        null,
        null,
      )
      const model2PrimaryKeyColumnType = convertToPostgresColumnType(
        model2PrimaryKeyInfo.type,
        null,
        null,
      )

      const joinTableName = createManyToManyJoinTableName(
        relation.model1,
        relation.model2,
      )

      // Create join table with constraints
      tables[joinTableName] = createManyToManyJoinTableWithConstraints(
        joinTableName,
        model1PrimaryKeyColumnType,
        model2PrimaryKeyColumnType,
        relation.model1,
        model1PrimaryKeyInfo.name,
        relation.model2,
        model2PrimaryKeyInfo.name,
      )
    }
  }
}

/**
 * Main function to parse a Prisma schema
 */
async function parsePrismaSchema(schemaString: string): Promise<ProcessResult> {
  const dmmf = await getDMMF({ datamodel: schemaString })
  const errors: Error[] = []

  // Track many-to-many relationships for later processing
  const processedManyToManyRelations = new Set<string>()
  const manyToManyRelations: Array<{
    model1: string
    model2: string
    field1: DMMF.Field
    field2: DMMF.Field
  }> = []

  // Build field renaming map
  const tableFieldRenaming = buildFieldRenamingMap(dmmf.datamodel.models)

  // Process models and create tables
  const tables = processTables(dmmf.datamodel.models, tableFieldRenaming)

  // Process constraints
  processConstraints(
    dmmf.datamodel.models,
    tables,
    tableFieldRenaming,
    processedManyToManyRelations,
    manyToManyRelations,
  )

  // Process indexes
  processIndexes(
    dmmf.datamodel.indexes,
    dmmf.datamodel.models,
    tables,
    tableFieldRenaming,
  )

  // Process many-to-many relationships
  processManyToManyRelationships(
    manyToManyRelations,
    tables,
    dmmf.datamodel.models,
  )

  return {
    value: {
      tables,
    },
    errors: errors,
  }
}

function extractIndex(index: DMMF.Index): Index | null {
  switch (index.type) {
    case 'id':
      return {
        name: `${index.model}_pkey`,
        unique: true,
        columns: index.fields.map((field) => field.name),
        type: '',
      }
    case 'unique':
      return {
        name: `${index.model}_${index.fields.map((field) => field.name).join('_')}_key`,
        unique: true,
        columns: index.fields.map((field) => field.name),
        type: '',
      }
    case 'normal':
      return {
        name: `${index.model}_${index.fields.map((field) => field.name).join('_')}_idx`,
        unique: false,
        columns: index.fields.map((field) => field.name),
        type: index.algorithm ?? '',
      }
    // NOTE: fulltext index is not supported for postgres
    // ref: https://www.prisma.io/docs/orm/prisma-schema/data-model/indexes#full-text-indexes-mysql-and-mongodb
    case 'fulltext':
      return null
    default:
      return null
  }
}

function extractDefaultValue(field: DMMF.Field) {
  const value = field.default?.valueOf()
  const defaultValue = value === undefined ? null : value
  // NOTE: When `@default(autoincrement())` is specified, `defaultValue` becomes an object
  // like `{"name":"autoincrement","args":[]}` (DMMF.FieldDefault).
  // This function handles both primitive types (`string | number | boolean`) and objects,
  // returning a string like `name(args)` for objects.
  // Note: `FieldDefaultScalar[]` is not supported.
  if (typeof defaultValue === 'object' && defaultValue !== null) {
    if ('name' in defaultValue && 'args' in defaultValue) {
      return `${defaultValue.name}(${defaultValue.args})`
    }
  }
  return typeof defaultValue === 'string' ||
    typeof defaultValue === 'number' ||
    typeof defaultValue === 'boolean'
    ? defaultValue
    : null
}

function normalizeConstraintName(
  constraint: string,
): ForeignKeyConstraintReferenceOption {
  // ref: https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions
  switch (constraint) {
    case 'Cascade':
      return 'CASCADE'
    case 'Restrict':
      return 'RESTRICT'
    case 'SetNull':
      return 'SET_NULL'
    case 'SetDefault':
      return 'SET_DEFAULT'
    default:
      return 'NO_ACTION'
  }
}

/**
 * Creates the name for a many-to-many join table
 */
function createManyToManyJoinTableName(model1: string, model2: string): string {
  return `_${model1}To${model2}`
}

/**
 * Creates a join table for a many-to-many relationship
 */
function createManyToManyJoinTable(
  joinTableName: string,
  table_A_ColumnType: string,
  table_B_ColumnType: string,
): Table {
  return {
    name: joinTableName,
    constraints: {},
    columns: {
      A: {
        name: 'A',
        type: table_A_ColumnType,
        default: null,
        notNull: true,
        comment: null,
        check: null,
      },
      B: {
        name: 'B',
        type: table_B_ColumnType,
        default: null,
        notNull: true,
        comment: null,
        check: null,
      },
    },
    comment: null,
    indexes: {
      [`${joinTableName}_AB_pkey`]: {
        name: `${joinTableName}_AB_pkey`,
        unique: true,
        columns: ['A', 'B'],
        type: '',
      },
      [`${joinTableName}_B_index`]: {
        name: `${joinTableName}_B_index`,
        unique: false,
        columns: ['B'],
        type: '',
      },
    },
  }
}

/**
 * Creates a join table with foreign key constraints for a many-to-many relationship
 */
function createManyToManyJoinTableWithConstraints(
  joinTableName: string,
  table_A_ColumnType: string,
  table_B_ColumnType: string,
  model1: string,
  primaryColumnNameOfA: string,
  model2: string,
  primaryColumnNameOfB: string,
): Table {
  const table = createManyToManyJoinTable(
    joinTableName,
    table_A_ColumnType,
    table_B_ColumnType,
  )

  // Add foreign key constraints
  table.constraints[`${joinTableName}_A_fkey`] = {
    type: 'FOREIGN KEY',
    name: `${joinTableName}_A_fkey`,
    columnName: 'A',
    targetTableName: model1,
    targetColumnName: primaryColumnNameOfA,
    updateConstraint: 'CASCADE',
    deleteConstraint: 'CASCADE',
  }

  table.constraints[`${joinTableName}_B_fkey`] = {
    type: 'FOREIGN KEY',
    name: `${joinTableName}_B_fkey`,
    columnName: 'B',
    targetTableName: model2,
    targetColumnName: primaryColumnNameOfB,
    updateConstraint: 'CASCADE',
    deleteConstraint: 'CASCADE',
  }

  return table
}

/**
 * Detects if a field is part of a many-to-many relation and stores it for later processing
 */
function isManyToManyField(field: DMMF.Field): boolean {
  return (
    field.isList &&
    (!field.relationFromFields || field.relationFromFields.length === 0) &&
    (!field.relationToFields || field.relationToFields.length === 0)
  )
}

function findRelatedField(
  field: DMMF.Field,
  model: DMMF.Model,
  models: readonly DMMF.Model[],
): DMMF.Field | undefined {
  const relatedModel = models.find((m) => m.name === field.type)
  if (!relatedModel) return undefined

  return relatedModel.fields.find(
    (f) =>
      f.relationName === field.relationName &&
      f.isList &&
      f.type === model.name,
  )
}

function getSortedModelPair(model1: string, model2: string): [string, string] {
  return model1.localeCompare(model2) < 0 ? [model1, model2] : [model2, model1]
}

function storeManyToManyRelation(
  model1: string,
  model2: string,
  field1: DMMF.Field,
  field2: DMMF.Field,
  processedRelations: Set<string>,
  manyToManyRelations: Array<{
    model1: string
    model2: string
    field1: DMMF.Field
    field2: DMMF.Field
  }>,
): void {
  const [sortedModel1, sortedModel2] = getSortedModelPair(model1, model2)
  const relationId = `${sortedModel1}_${sortedModel2}`

  if (!processedRelations.has(relationId)) {
    processedRelations.add(relationId)
    manyToManyRelations.push({
      model1: sortedModel1,
      model2: sortedModel2,
      field1: field1,
      field2: field2,
    })
  }
}

function detectAndStoreManyToManyRelation(
  field: DMMF.Field,
  model: DMMF.Model,
  models: readonly DMMF.Model[],
  processedRelations: Set<string>,
  manyToManyRelations: Array<{
    model1: string
    model2: string
    field1: DMMF.Field
    field2: DMMF.Field
  }>,
): boolean {
  if (!isManyToManyField(field)) return false

  const relatedField = findRelatedField(field, model, models)
  if (!relatedField) return false

  storeManyToManyRelation(
    model.name,
    field.type,
    field,
    relatedField,
    processedRelations,
    manyToManyRelations,
  )

  return true
}

function getPrimaryKeyInfo(table: Table, models: readonly DMMF.Model[]) {
  const tableName = table?.name
  const model = models.find((m) => m.name === tableName)

  if (!model) {
    return null // or throw an error if model is required
  }

  const tableIndexes = table?.indexes
  const primaryKeyIndex = tableIndexes[`${tableName}_pkey`]
  const primaryKeyColumnName = primaryKeyIndex?.columns[0]

  if (!primaryKeyColumnName) {
    return null // no primary key found
  }

  // Find the field in the model that matches the primary key column name
  const primaryKeyField = model.fields.find(
    (field) =>
      field.name === primaryKeyColumnName ||
      field.dbName === primaryKeyColumnName,
  )

  return primaryKeyField
}

export const processor: Processor = (str) => parsePrismaSchema(str)
