import type { Columns, Relationships, Tables } from '../../schema/index.js'
import { ProcessError } from '../errors.js'
import type { ProcessResult, Processor } from '../types.js'
import type { Schema } from './types.js'

export const processor: Processor = async (
  str: string,
): Promise<ProcessResult> => {
  try {
    const schema = JSON.parse(str) as Schema
    const errors: ProcessError[] = []

    if (!schema || typeof schema !== 'object') {
      throw new Error('Invalid schema format')
    }

    if (!Array.isArray(schema.tables)) {
      throw new Error('Invalid schema: tables must be an array')
    }

    const tables = schema.tables.reduce<Tables>((acc, table) => {
      if (!Array.isArray(table.columns)) {
        errors.push(
          new ProcessError(
            `Invalid table ${table.name}: columns must be an array`,
          ),
        )
        return acc
      }

      acc[table.name] = {
        name: table.name,
        columns: table.columns.reduce<Columns>((cols, column) => {
          cols[column.name] = {
            name: column.name,
            type: column.type,
            notNull: !column.nullable,
            default: column.default,
            comment: column.comment || null,
            primary: false,
            unique: false,
            check: null,
          }
          return cols
        }, {}),
        indices: {},
        comment: table.comment || null,
      }
      return acc
    }, {})

    const relationships = (schema.relations || []).reduce<Relationships>(
      (acc, relation) => {
        if (!relation.table || !relation.parent_table) {
          errors.push(
            new ProcessError('Invalid relation: missing table or parent_table'),
          )
          return acc
        }

        if (
          !Array.isArray(relation.columns) ||
          !Array.isArray(relation.parent_columns)
        ) {
          errors.push(
            new ProcessError(
              `Invalid relation between ${relation.parent_table} and ${relation.table}: columns must be arrays`,
            ),
          )
          return acc
        }

        const name = `${relation.parent_table}_to_${relation.table}`
        acc[name] = {
          name,
          primaryTableName: relation.parent_table,
          primaryColumnName: relation.parent_columns[0] || 'id',
          foreignTableName: relation.table,
          foreignColumnName: relation.columns[0] || '',
          cardinality:
            relation.cardinality === 'one' ? 'ONE_TO_ONE' : 'ONE_TO_MANY',
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        }
        return acc
      },
      {},
    )

    return {
      value: {
        tables,
        relationships,
      },
      errors,
    }
  } catch (error) {
    return {
      value: { tables: {}, relationships: {} },
      errors: [
        new ProcessError(
          error instanceof Error ? error.message : 'Unknown error occurred',
        ),
      ],
    }
  }
}
