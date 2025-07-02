import type { EvaluationResult } from '../../types'

export const calculateAverageMetrics = (results: EvaluationResult[]) => {
  const length = results.length
  return {
    tableF1Score:
      results.reduce((sum, r) => sum + r.metrics.tableF1Score, 0) / length,
    tableAllCorrectRate:
      results.reduce((sum, r) => sum + r.metrics.tableAllCorrectRate, 0) /
      length,
    columnF1ScoreAverage:
      results.reduce((sum, r) => sum + r.metrics.columnF1ScoreAverage, 0) /
      length,
    columnAllCorrectRateAverage:
      results.reduce(
        (sum, r) => sum + r.metrics.columnAllCorrectRateAverage,
        0,
      ) / length,
    primaryKeyAccuracyAverage:
      results.reduce((sum, r) => sum + r.metrics.primaryKeyAccuracyAverage, 0) /
      length,
    constraintAccuracy:
      results.reduce((sum, r) => sum + r.metrics.constraintAccuracy, 0) /
      length,
    foreignKeyF1Score:
      results.reduce((sum, r) => sum + r.metrics.foreignKeyF1Score, 0) / length,
    foreignKeyAllCorrectRate:
      results.reduce((sum, r) => sum + r.metrics.foreignKeyAllCorrectRate, 0) /
      length,
    overallSchemaAccuracy:
      results.reduce((sum, r) => sum + r.metrics.overallSchemaAccuracy, 0) /
      length,
  }
}
