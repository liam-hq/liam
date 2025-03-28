import type { DMMF } from '@prisma/generator-helper'
import pkg from '@prisma/internals'
import type {
  Columns,
  ForeignKeyConstraint,
  Index,
  Relationship,
  Table,
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
  const errors: Error[] = []

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
    }

    tables[model.name] = {
      name: model.name,
      columns,
      comment: model.documentation ?? null,
      indices: {},
    }
  }

  for (const model of dmmf.datamodel.models) {
    for (const field of model.fields) {
      if (!field.relationName) continue

      const existingRelationship = relationships[field.relationName]
      const isTargetField =
        field.relationToFields?.[0] &&
        (field.relationToFields?.length ?? 0) > 0 &&
        field.relationFromFields?.[0] &&
        (field.relationFromFields?.length ?? 0) > 0

      const relationship: Relationship = {
        name: field.relationName,
        primaryTableName: field.type,
        primaryColumnName:
          Array.isArray(field.relationToFields) &&
          field.relationToFields.length > 0
            ? field.relationToFields[0]
            : '',
        foreignTableName: model.name,
        foreignColumnName:
          Array.isArray(field.relationFromFields) &&
          field.relationFromFields.length > 0
            ? field.relationFromFields[0]
            : '',
        cardinality: 'ONE_TO_ONE', // Default
        updateConstraint: 'NO_ACTION',
        deleteConstraint: normalizeConstraintName(field.relationOnDelete ?? ''),
      }

      if (field.isList) {
        if (
          existingRelationship &&
          existingRelationship.cardinality === 'ONE_TO_ONE'
        ) {
          // If an existing relation is ONE_TO_ONE and this field is a list → Change it to ONE_TO_MANY
          relationship.cardinality = 'ONE_TO_MANY'
        } else {
          // Otherwise, it's a MANY_TO_MANY relationship
          relationship.cardinality = 'MANY_TO_MANY'
        }
      } else {
        if (
          existingRelationship &&
          existingRelationship.cardinality === 'MANY_TO_MANY' &&
          isTargetField
        ) {
          relationship.cardinality = 'ONE_TO_MANY'
        }
      }

      relationships[relationship.name] = getFieldRenamedRelationship(
        relationship,
        tableFieldRenaming,
      )
    }
  }

  for (const index of dmmf.datamodel.indexes) {
    const table = tables[index.model]
    if (!table) continue

    const indexInfo = extractIndex(
      getFieldRenamedIndex(index, tableFieldRenaming),
    )
    if (!indexInfo) continue
    table.indices[indexInfo.name] = indexInfo
  }

  const manyToManyRelationships = Object.fromEntries(
    Object.entries(relationships).filter(
      ([_, rel]) => rel.cardinality === 'MANY_TO_MANY',
    ),
  )

  if (Object.keys(manyToManyRelationships).length) {
    for (const relationship in manyToManyRelationships) {
      const relationshipValue = manyToManyRelationships[relationship]
      if (!relationshipValue) continue // Skip if undefined
      const relationshipName = relationshipValue?.name

      const { primaryTableName, foreignTableName } = relationshipValue
      const indexes = dmmf?.datamodel?.indexes
      if (!indexes) continue

      const primaryTableIndices = getTableIndices(indexes, primaryTableName)

      const foreignTableIndices = getTableIndices(indexes, foreignTableName)

      const columns: Columns = {}

      const relationshipTableName = `_${relationship}`
      processTableIndices(
        primaryTableIndices,
        primaryTableName,
        tables,
        columns,
        relationshipName,
        relationships,
        relationshipTableName,
      )
      processTableIndices(
        foreignTableIndices,
        primaryTableName,
        tables,
        columns,
        relationshipName,
        relationships,
        relationshipTableName,
      )

      const indicesColumn = Object.keys(columns)
      const indicesName = `${relationshipValue?.name}_pkey`

      tables[relationshipTableName] = {
        name: relationshipTableName,
        columns,
        comment: null,
        indices: {
          [indicesName]: {
            name: indicesName,
            unique: true,
            columns: indicesColumn,
          },
        },
      }
    }
  }

  for (const key in relationships) {
    if (relationships[key]?.cardinality === 'MANY_TO_MANY') {
      delete relationships[key]
    }
  }
  return {
    value: {
      tables,
      relationships,
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
      }
    case 'unique':
      return {
        name: `${index.model}_${index.fields
          .map((field) => field.name)
          .join('_')}_key`,
        unique: true,
        columns: index.fields.map((field) => field.name),
      }
    case 'normal':
      return {
        name: `${index.model}_${index.fields
          .map((field) => field.name)
          .join('_')}_idx`,
        unique: false,
        columns: index.fields.map((field) => field.name),
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

function normalizeConstraintName(constraint: string): ForeignKeyConstraint {
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

function getTableIndices(indexes: readonly DMMF.Index[], tableName: string) {
  return indexes.filter(
    (index) => index.model === tableName && index.type === 'id',
  )
}

function processTableIndices(
  indices: readonly DMMF.Index[],
  tableName: string,
  tables: Record<string, Table>,
  columns: Columns,
  relationshipName: string,
  relationships: Record<string, Relationship>,
  relationshipTableName: string,
): void {
  for (const table of indices) {
    for (const field of table.fields) {
      const existingColumns = tableName && tables[tableName]?.columns['id']
      const columnName = table.model + field.name
      if (existingColumns && typeof existingColumns === 'object') {
        columns[columnName] = {
          name: columnName,
          type: existingColumns.type ?? 'id',
          default: existingColumns.default ?? '',
          notNull: existingColumns.notNull,
          unique: existingColumns.unique,
          primary: existingColumns.primary,
          comment: existingColumns.comment,
          check: existingColumns.check,
        }
      } else {
        columns[columnName] = {
          name: columnName,
          type: 'id',
          default: '',
          notNull: false,
          unique: false,
          primary: false,
          comment: '',
          check: '',
        }
      }

      const relationShipWithTheTable = `${table.model}To${relationshipName}`
      relationships[relationShipWithTheTable] = {
        name: relationShipWithTheTable,
        primaryTableName: table.model,
        primaryColumnName: field?.name,
        foreignTableName: relationshipTableName,
        foreignColumnName: columnName,
        cardinality: 'ONE_TO_MANY',
        updateConstraint: 'NO_ACTION',
        deleteConstraint: 'NO_ACTION',
      }
    }
  }
}
export const processor: Processor = (str) => parsePrismaSchema(str)
