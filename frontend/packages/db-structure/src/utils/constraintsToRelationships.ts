import * as v from 'valibot'
import type { Constraint, Tables } from '../schema/index.js'
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
    for (const constraint of Object.values(table.constraints) as Constraint[]) {
      const result = v.safeParse(foreignKeyConstraintSchema, constraint)
      if (!result.success) {
        continue
      }

      const foreignKeyConstraint = result.output
      const cardinality = determineCardinality(
        tables,
        table.name,
        foreignKeyConstraint.columnName,
      )

      relationships[constraint.name] = {
        name: constraint.name,
        primaryTableName: foreignKeyConstraint.targetTableName,
        primaryColumnName: foreignKeyConstraint.targetColumnName,
        foreignTableName: table.name,
        foreignColumnName: foreignKeyConstraint.columnName,
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
  for (const constraint of Object.values(table.constraints) as Constraint[]) {
    if (constraint.type === 'UNIQUE' && constraint.columnName === columnName) {
      return 'ONE_TO_ONE'
    }
  }

  return 'ONE_TO_MANY'
}
