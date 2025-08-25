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

      // Handle both single and composite foreign keys by creating a relationship for each column pair
      const columnCount = Math.min(
        foreignKeyConstraint.columnNames.length,
        foreignKeyConstraint.targetColumnNames.length,
      )

      // Determine cardinality once for all column pairs (they should all have the same cardinality)
      const cardinality = determineCardinalityForForeignKey(
        tables,
        table.name,
        foreignKeyConstraint.columnNames,
      )

      for (let i = 0; i < columnCount; i++) {
        const columnName = foreignKeyConstraint.columnNames[i]
        const targetColumnName = foreignKeyConstraint.targetColumnNames[i]

        if (!columnName || !targetColumnName) {
          continue
        }

        // For composite keys, append index to make unique relationship names
        const relationshipKey =
          columnCount > 1 ? `${constraint.name}_${i}` : constraint.name

        relationships[relationshipKey] = {
          name: relationshipKey,
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
  }

  return relationships
}

/**
 * Determine the cardinality of a foreign key relationship
 * For composite foreign keys, checks if there's a UNIQUE constraint covering all foreign key columns
 */
const determineCardinalityForForeignKey = (
  tables: Tables,
  tableName: string,
  foreignKeyColumns: string[],
): Cardinality => {
  const table = tables[tableName]
  if (!table) {
    return 'ONE_TO_MANY'
  }

  // Check for UNIQUE constraint that covers all foreign key columns
  for (const constraint of Object.values(table.constraints)) {
    if (constraint.type === 'UNIQUE') {
      // Check if the UNIQUE constraint contains all foreign key columns
      const uniqueColumnsSet = new Set(constraint.columnNames)
      const allForeignKeyColumnsInUnique = foreignKeyColumns.every((col) =>
        uniqueColumnsSet.has(col),
      )

      if (allForeignKeyColumnsInUnique) {
        // If the UNIQUE constraint has exactly the same columns as the foreign key,
        // or if it's a subset (foreign key columns are all included), it's ONE_TO_ONE
        return 'ONE_TO_ONE'
      }
    }
  }

  return 'ONE_TO_MANY'
}
