import type { Schema } from '@liam-hq/db-structure'

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
