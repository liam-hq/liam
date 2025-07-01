import type { AverageCalculationParams } from '../types.ts'

export const calculateAverages = ({
  totalColumnF1Score,
  totalColumnAllCorrectCount,
  totalPrimaryKeyCorrectCount,
  totalConstraintCorrectCount,
  totalTableCount,
}: AverageCalculationParams) => {
  const columnF1ScoreAverage = totalTableCount
    ? totalColumnF1Score / totalTableCount
    : 0
  const columnAllCorrectRateAverage = totalTableCount
    ? totalColumnAllCorrectCount / totalTableCount
    : 0
  const primaryKeyAccuracyAverage = totalTableCount
    ? totalPrimaryKeyCorrectCount / totalTableCount
    : 0
  const constraintAccuracy = totalTableCount
    ? totalConstraintCorrectCount / totalTableCount
    : 0

  return {
    columnF1ScoreAverage,
    columnAllCorrectRateAverage,
    primaryKeyAccuracyAverage,
    constraintAccuracy,
  }
}
