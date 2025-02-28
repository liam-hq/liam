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

      const relationship: Relationship = isTargetField
        ? ({
            name: field.relationName,
            primaryTableName: field.type,
            primaryColumnName: field.relationToFields[0] ?? '',
            foreignTableName: model.name,
            foreignColumnName: field.relationFromFields[0] ?? '',
            cardinality: existingRelationship?.cardinality ?? 'ONE_TO_MANY',
            updateConstraint: 'NO_ACTION',
            deleteConstraint: normalizeConstraintName(
              field.relationOnDelete ?? '',
            ),
          } as const)
        : ({
            name: field.relationName,
            primaryTableName: existingRelationship?.primaryTableName ?? '',
            primaryColumnName: existingRelationship?.primaryColumnName ?? '',
            foreignTableName: existingRelationship?.foreignTableName ?? '',
            foreignColumnName: existingRelationship?.foreignColumnName ?? '',
            cardinality: field.isList ? 'ONE_TO_MANY' : 'ONE_TO_ONE',
            updateConstraint: 'NO_ACTION',
            deleteConstraint: 'NO_ACTION',
          } as const)

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
        name: `${index.model}_${index.fields.map((field) => field.name).join('_')}_key`,
        unique: true,
        columns: index.fields.map((field) => field.name),
      }
    case 'normal':
      return {
        name: `${index.model}_${index.fields.map((field) => field.name).join('_')}_idx`,
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

export const processor: Processor = (str) => parsePrismaSchema(str)
