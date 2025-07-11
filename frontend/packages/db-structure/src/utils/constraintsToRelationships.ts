import * as v from 'valibot'
import type { Tables } from '../schema/index.js'
import { foreignKeyConstraintSchema } from '../schema/index.js'

// Define types locally since they're no longer exported from schema
export type Cardinality = 'ONE_TO_ONE' | 'ONE_TO_MANY'

export type Relationship = {
  name: string
  primaryTableName: string
  primaryColumnName: string
  foreignTableName: string
  foreignColumnName: string
  cardinality: Cardinality
  updateConstraint?: string
  deleteConstraint?: string
}

export type Relationships = Record<string, Relationship>

/**
 * Convert foreign key constraints to relationships for UI display
 * @param tables - The tables object containing constraints
 * @returns Relationships derived from foreign key constraints
 */
export const constraintsToRelationships = (tables: Tables): Relationships => {
  const relationships: Relationships = {}

  for (const table of Object.values(tables)) {
    for (const constraint of Object.values(table.constraints)) {
      const result = v.safeParse(foreignKeyConstraintSchema, constraint)
      if (!result.success) {
        continue
      }

      const foreignKeyConstraint = result.output
      // For now, we only support single-column foreign keys in relationships
      // TODO: Support composite foreign keys in relationships
      if (
        foreignKeyConstraint.columnNames.length !== 1 ||
        foreignKeyConstraint.targetColumnNames.length !== 1
      ) {
        continue
      }

      const columnName = foreignKeyConstraint.columnNames[0]
      const targetColumnName = foreignKeyConstraint.targetColumnNames[0]

      if (!columnName || !targetColumnName) {
        continue
      }

      const cardinality = determineCardinality(tables, table.name, columnName)

      relationships[constraint.name] = {
        name: constraint.name,
        primaryTableName: foreignKeyConstraint.targetTableName,
        primaryColumnName: targetColumnName,
        foreignTableName: table.name,
        foreignColumnName: columnName,
        cardinality,
        updateConstraint: foreignKeyConstraint.updateConstraint,
        deleteConstraint: foreignKeyConstraint.deleteConstraint,
      }
    }
  }

  return relationships
}

/**
 * Determine the cardinality of a relationship based on column constraints
 */
const determineCardinality = (
  tables: Tables,
  tableName: string,
  columnName: string,
): Cardinality => {
  const table = tables[tableName]
  if (!table) {
    return 'ONE_TO_MANY'
  }

  // Check for UNIQUE constraint in table constraints
  for (const constraint of Object.values(table.constraints)) {
    if (
      constraint.type === 'UNIQUE' &&
      constraint.columnNames.includes(columnName)
    ) {
      return 'ONE_TO_ONE'
    }
  }

  return 'ONE_TO_MANY'
}
