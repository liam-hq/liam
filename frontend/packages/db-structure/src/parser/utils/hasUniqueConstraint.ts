import type { Constraints, UniqueConstraint } from '../../schema/schema.js'

/**
 * Checks if a column has a unique constraint by looking through the table's constraints
 * @param constraints - The table's constraints object
 * @param columnName - The name of the column to check
 * @returns true if the column has a unique constraint, false otherwise
 */
export const hasUniqueConstraint = (
  constraints: Constraints,
  columnName: string,
): boolean => {
  return Object.values(constraints).some(
    (constraint): constraint is UniqueConstraint =>
      constraint.type === 'UNIQUE' && constraint.columnName === columnName,
  )
}
