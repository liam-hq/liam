import type { Constraints } from '../schema/index.js'

export const isPrimaryKey = (
  columnName: string,
  constraints: Constraints,
): boolean => {
  return Object.values(constraints).some(
    (constraint) =>
      constraint.type === 'PRIMARY KEY' &&
      constraint.columnNames.includes(columnName),
  )
}
