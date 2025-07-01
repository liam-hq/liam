import type { PrimaryKeyConstraint, Schema } from '@liam-hq/db-structure'
import type { Mapping } from './types.ts'

export const validatePrimaryKeys = (
  referenceTable: Schema['tables'][string],
  predictTable: Schema['tables'][string],
  columnMapping: Mapping,
): boolean => {
  const referencePKs = Object.values(referenceTable.constraints)
    .filter((c): c is PrimaryKeyConstraint => c.type === 'PRIMARY KEY')
    .map((c) => c.columnName)
  const predictPKs = Object.values(predictTable.constraints)
    .filter((c): c is PrimaryKeyConstraint => c.type === 'PRIMARY KEY')
    .map((c) => c.columnName)

  if (referencePKs.length !== predictPKs.length) {
    return false
  }

  return referencePKs.every(
    (refPK: string) =>
      columnMapping[refPK] && predictPKs.includes(columnMapping[refPK]),
  )
}

// TODO: Implement constraint validation logic. Now it only checks if the number of constraints matches.
export const validateConstraints = (
  referenceTable: Schema['tables'][string],
  predictTable: Schema['tables'][string],
): boolean => {
  const referenceConstraintCount = Object.keys(
    referenceTable.constraints,
  ).length
  const predictConstraintCount = Object.keys(predictTable.constraints).length
  return referenceConstraintCount === predictConstraintCount
}
