import type { Constraint, Constraints } from '../schema/index.js'

export const isPrimaryKey = (
  columnName: string,
  constraints: Constraints,
): boolean => {
  return (Object.values(constraints) as Constraint[]).some(
    (constraint) =>
      constraint.type === 'PRIMARY KEY' && constraint.columnName === columnName,
  )
}
