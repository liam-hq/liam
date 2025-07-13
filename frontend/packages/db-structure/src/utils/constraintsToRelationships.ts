import * as v from 'valibot'
import type { Tables } from '../schema/index.js'
import { foreignKeyConstraintSchema } from '../schema/index.js'
import { interleaveConstraintSchema } from '../schema/schema.js'

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
 * Convert foreign key constraints and Google Cloud Spanner's interleave to relationships for UI display
 * @param tables - The tables object containing constraints
 * @returns Relationships derived from foreign key constraints
 */
export const constraintsToRelationships = (tables: Tables): Relationships => {
  const relationships: Relationships = {}

  for (const table of Object.values(tables)) {
    for (const constraint of Object.values(table.constraints)) {
      if (
        constraint.type !== 'FOREIGN KEY' &&
        constraint.type !== 'INTERLEAVE'
      ) {
        continue
      }

      const schema =
        constraint.type === 'FOREIGN KEY'
          ? foreignKeyConstraintSchema
          : interleaveConstraintSchema

      const result = v.safeParse(schema, constraint)
      if (!result.success) {
        continue
      }

      const parsedConstraint = result.output
      const cardinality = determineCardinality(
        tables,
        table.name,
        parsedConstraint.columnName,
      )

      relationships[constraint.name] = {
        name: constraint.name,
        primaryTableName: parsedConstraint.targetTableName,
        primaryColumnName: parsedConstraint.targetColumnName,
        foreignTableName: table.name,
        foreignColumnName: parsedConstraint.columnName,
        cardinality,
        updateConstraint: parsedConstraint.updateConstraint,
        deleteConstraint: parsedConstraint.deleteConstraint,
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
    if (constraint.type === 'UNIQUE' && constraint.columnName === columnName) {
      return 'ONE_TO_ONE'
    }
  }

  return 'ONE_TO_MANY'
}
