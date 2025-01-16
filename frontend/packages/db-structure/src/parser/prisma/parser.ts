// biome-ignore lint/correctness/noNodejsModules: workaround for CommonJS module import
import { createRequire } from 'node:module'
import type { Columns, Relationship, Table } from '../../schema/index.js'
import type { ProcessResult, Processor } from '../types.js'

const require = createRequire(import.meta.url)
const pkg = require('@prisma/internals')

// NOTE: Workaround for CommonJS module import issue with @prisma/internals
// CommonJS module can not support all module.exports as named exports
const { getDMMF } = pkg

async function parsePrismaSchema(schemaString: string): Promise<ProcessResult> {
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
