import type { Columns, Relationship, Table } from '../../schema/index.js'
import type { ProcessResult, Processor } from '../types.js'

async function parsePrismaSchema(schemaString: string): Promise<ProcessResult> {
  // biome-ignore lint/nursery/noCommonJs:
  const pkg = require('@prisma/internals')
  const { getDMMF } = pkg
  const dmmf = await getDMMF({ datamodel: schemaString })
  const tables: Record<string, Table> = {}
  const relationships: Record<string, Relationship> = {}
  const errors: Error[] = []

  for (const model of dmmf.datamodel.models) {
    const columns: Columns = {}
    for (const field of model.fields) {
      columns[field.name] = {
        name: field.name,
        type: field.type,
        default: null,
        notNull: field.isRequired,
        unique: field.isUnique,
        primary: field.isId,
        comment: null,
        check: null,
      }
    }

    tables[model.name] = {
      name: model.name,
      columns,
      comment: null,
      indices: {},
    }
  }

  for (const model of dmmf.datamodel.models) {
    for (const field of model.fields) {
      if (field.relationName) {
        const relationship: Relationship = {
          name: field.relationName,
          primaryTableName: model.name,
          primaryColumnName: field.relationFromFields?.[0] || '',
          foreignTableName: field.type,
          foreignColumnName: field.relationToFields?.[0] || '',
          cardinality: 'ONE_TO_MANY',
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        }
        relationships[relationship.name] = relationship
      }
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

export const processor: Processor = (str) => parsePrismaSchema(str)
