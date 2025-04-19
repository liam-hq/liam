import type { DMMF } from '@prisma/generator-helper'
import pkg from '@prisma/internals'
import type {
  Columns,
  Constraints,
  ForeignKeyConstraint,
  ForeignKeyConstraintReferenceOption,
  Index,
  Relationship,
  Table,
  TableGroup,
} from '../../schema/index.js'
import type { ProcessResult, Processor } from '../types.js'
import { convertToPostgresColumnType } from './convertToPostgresColumnType.js'

// NOTE: Workaround for CommonJS module import issue with @prisma/internals
// CommonJS module can not support all module.exports as named exports
const { getDMMF } = pkg

const getFieldRenamedRelationship = (
  relationship: Relationship,
  tableFieldsRenaming: Record<string, Record<string, string>>,
) => {
  const mappedPrimaryColumnName =
    tableFieldsRenaming[relationship.primaryTableName]?.[
      relationship.primaryColumnName
    ]
  if (mappedPrimaryColumnName) {
    relationship.primaryColumnName = mappedPrimaryColumnName
  }

  const mappedForeignColumnName =
    tableFieldsRenaming[relationship.foreignTableName]?.[
      relationship.foreignColumnName
    ]
  if (mappedForeignColumnName) {
    relationship.foreignColumnName = mappedForeignColumnName
  }

  return relationship
}

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

async function parsePrismaSchema(schemaString: string): Promise<ProcessResult> {
  const dmmf = await getDMMF({ datamodel: schemaString })
  const tables: Record<string, Table> = {}
  const relationships: Record<string, Relationship> = {}
  const tableGroups: Record<string, TableGroup> = {}
  const errors: Error[] = []

  // Track many-to-many relationships for later processing
  // Use a Set to store unique relationship identifiers to avoid duplicates
  const processedManyToManyRelations = new Set<string>()
  const manyToManyRelations: Array<{
    model1: string
    model2: string
    field1: DMMF.Field
    field2: DMMF.Field
  }> = []
  const tableFieldRenaming: Record<string, Record<string, string>> = {}
  for (const model of dmmf.datamodel.models) {
    for (const field of model.fields) {
      if (field.dbName) {
        const fieldConversions = tableFieldRenaming[model.name] ?? {}
        fieldConversions[field.name] = field.dbName
        tableFieldRenaming[model.name] = fieldConversions
      }
    }
  }

  for (const model of dmmf.datamodel.models) {
    const columns: Columns = {}
    const constraints: Constraints = {}
    for (const field of model.fields) {
      if (field.relationName) continue
      const defaultValue = extractDefaultValue(field)
      const fieldName =
        tableFieldRenaming[model.name]?.[field.name] ?? field.name
      columns[fieldName] = {
        name: fieldName,
        type: convertToPostgresColumnType(
          field.type,
          field.nativeType,
          defaultValue,
        ),
        default: defaultValue,
        notNull: field.isRequired,
        unique: field.isId || field.isUnique,
        primary: field.isId,
        comment: field.documentation ?? null,
        check: null,
      }

      if (field.isId) {
        const constraintName = `PRIMARY_${fieldName}`
        constraints[constraintName] = {
          type: 'PRIMARY KEY',
          name: constraintName,
          columnName: fieldName,
        }
      } else if (field.isUnique) {
        // to avoid duplicate with PRIMARY KEY constraint, it doesn't create constraint object with `field.isId`
        const constraintName = `UNIQUE_${fieldName}`
        constraints[constraintName] = {
          type: 'UNIQUE',
          name: constraintName,
          columnName: fieldName,
        }
      }
    }

    tables[model.name] = {
      name: model.name,
      columns,
      comment: model.documentation ?? null,
      indexes: {},
      constraints,
    }
  }
  for (const model of dmmf.datamodel.models) {
    for (const field of model.fields) {
      if (!field.relationName) continue

      // Check if this is a many-to-many relation and process it
      if (
        detectAndStoreManyToManyRelation(
          field,
          model,
          dmmf.datamodel.models,
          processedManyToManyRelations,
          manyToManyRelations,
        )
      ) {
        continue // Skip normal relationship processing
      }

      const existingRelationship = relationships[field.relationName]
      const isTargetField =
        field.relationToFields?.[0] &&
        (field.relationToFields?.length ?? 0) > 0 &&
        field.relationFromFields?.[0] &&
        (field.relationFromFields?.length ?? 0) > 0

      // Get the column names with fallback to empty string
      const primaryColumnName = field.relationToFields?.[0] ?? ''
      const foreignColumnName = field.relationFromFields?.[0] ?? ''
      const _relationship: Relationship = isTargetField
        ? ({
            name: field.relationName,
            primaryTableName: field.type,
            primaryColumnName,
            foreignTableName: model.name,
            foreignColumnName,
            cardinality: existingRelationship?.cardinality ?? 'ONE_TO_MANY',
            updateConstraint: 'NO_ACTION',
            deleteConstraint: normalizeConstraintName(
              field.relationOnDelete ?? '',
            ),
          }
        : {
            name: field.relationName,
            primaryTableName: existingRelationship?.primaryTableName ?? '',
            primaryColumnName: existingRelationship?.primaryColumnName ?? '',
            foreignTableName: existingRelationship?.foreignTableName ?? '',
            foreignColumnName: existingRelationship?.foreignColumnName ?? '',
            cardinality: field.isList ? 'ONE_TO_MANY' : 'ONE_TO_ONE',
            updateConstraint: 'NO_ACTION',
            deleteConstraint: 'NO_ACTION',
          }

      const relationship = getFieldRenamedRelationship(
        _relationship,
        tableFieldRenaming,
      )
      relationships[relationship.name] = relationship

      const constraint: ForeignKeyConstraint = {
        type: 'FOREIGN KEY',
        name: relationship.name,
        columnName: relationship.foreignColumnName,
        targetTableName: relationship.primaryTableName,
        targetColumnName: relationship.primaryColumnName,
        updateConstraint: relationship.updateConstraint,
        deleteConstraint: relationship.deleteConstraint,
      }
      const table = tables[relationship.foreignTableName]
      if (table) {
        table.constraints[constraint.name] = constraint
      }
    }
  }
  for (const index of dmmf.datamodel.indexes) {
    const table = tables[index.model]
    if (!table) continue

    const indexInfo = extractIndex(
      getFieldRenamedIndex(index, tableFieldRenaming),
    )
    if (!indexInfo) continue
    table.indexes[indexInfo.name] = indexInfo
  }

  // Process many-to-many relations
  for (const relation of manyToManyRelations) {
    const table_A = tables[relation.model1]
    const table_B = tables[relation.model2]

    // Skip if both tables are undefined
    if (table_A === undefined && table_B === undefined) continue

    // Get primary key info for model1 if table_A exists
    const model1PrimaryKeyInfo = table_A
      ? getPrimaryKeyInfo(table_A, dmmf.datamodel.models)
      : null

    // Get primary key info for model2 if table_B exists
    const model2PrimaryKeyInfo = table_B
      ? getPrimaryKeyInfo(table_B, dmmf.datamodel.models)
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
      // Create join table
      tables[joinTableName] = createManyToManyJoinTable(
        joinTableName,
        model1PrimaryKeyColumnType,
        model2PrimaryKeyColumnType,
      )

      // Add relationships for the join table
      const joinTableRelationships = createManyToManyRelationships(
        joinTableName,
        relation.model1,
        model1PrimaryKeyInfo.name,
        relation.model2,
        model2PrimaryKeyInfo.name,
      )
      // Add the relationships to the global relationships object
      Object.assign(relationships, joinTableRelationships)
    }
  }

  return {
    value: {
      tables,
      relationships,
      tableGroups,
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
        unique: false,
        primary: false,
        comment: null,
        check: null,
      },
      B: {
        name: 'B',
        type: table_B_ColumnType,
        default: null,
        notNull: true,
        unique: false,
        primary: false,
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
 * Creates relationships for a many-to-many join table
 */
function createManyToManyRelationships(
  joinTableName: string,
  model1: string,
  primaryColumnNameOfA: string,
  model2: string,
  primaryColumnNameOfB: string,
): Record<string, Relationship> {
  return {
    [`${joinTableName}_A_fkey`]: {
      name: `${joinTableName}_A_fkey`,
      primaryTableName: model1,
      primaryColumnName: primaryColumnNameOfA,
      foreignTableName: joinTableName,
      foreignColumnName: 'A',
      cardinality: 'ONE_TO_MANY',
      updateConstraint: 'CASCADE',
      deleteConstraint: 'CASCADE',
    },
    [`${joinTableName}_B_fkey`]: {
      name: `${joinTableName}_B_fkey`,
      primaryTableName: model2,
      primaryColumnName: primaryColumnNameOfB,
      foreignTableName: joinTableName,
      foreignColumnName: 'B',
      cardinality: 'ONE_TO_MANY',
      updateConstraint: 'CASCADE',
      deleteConstraint: 'CASCADE',
    },
  }
}

/**
 * Detects if a field is part of a many-to-many relation and stores it for later processing
 */
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
  // Check if this is a many-to-many relation (list field with no relation fields)
  if (
    field.isList &&
    (!field.relationFromFields || field.relationFromFields.length === 0) &&
    (!field.relationToFields || field.relationToFields.length === 0)
  ) {
    // Find the corresponding field in the related model
    const relatedModel = models.find((m) => m.name === field.type)
    if (relatedModel) {
      const relatedField = relatedModel.fields.find(
        (f) =>
          f.relationName === field.relationName &&
          f.isList &&
          f.type === model.name,
      )

      if (relatedField) {
        // Create a unique identifier for this relationship
        // Sort model names to ensure consistent ordering
        const modelNames = [model.name, field.type].sort()
        const relationId = `${modelNames[0]}_${modelNames[1]}`

        // Only process this relationship if we haven't seen it before
        if (!processedRelations.has(relationId)) {
          processedRelations.add(relationId)

          // Store this many-to-many relation for later processing
          if (modelNames[0] && modelNames[1]) {
            manyToManyRelations.push({
              model1: modelNames[0],
              model2: modelNames[1],
              field1: field,
              field2: relatedField,
            })
          }
        }
        return true // Indicate that we found and processed a many-to-many relation
      }
    }
  }
  return false // Not a many-to-many relation
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
