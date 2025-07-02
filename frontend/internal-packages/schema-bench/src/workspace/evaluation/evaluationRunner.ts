import { ResultAsync } from 'neverthrow'
import { evaluate } from '../../evaluate/evaluate.ts'
import type { CaseData, EvaluationResult, WorkspaceError } from '../types'

export const runEvaluation = (
  caseData: CaseData,
): ResultAsync<EvaluationResult, WorkspaceError> => {
  return ResultAsync.fromPromise(
    evaluate(caseData.referenceSchema, caseData.outputSchema),
    (error) => ({
      type: 'EVALUATION_ERROR' as const,
      caseId: caseData.caseId,
      cause:
        error instanceof Error ? error.message : 'Unknown evaluation error',
    }),
  ).map((result) => ({
    timestamp: new Date().toISOString(),
    caseId: caseData.caseId,
    metrics: {
      tableF1Score: result.tableF1Score,
      tableAllCorrectRate: result.tableAllCorrectRate,
      columnF1ScoreAverage: result.columnF1ScoreAverage,
      columnAllCorrectRateAverage: result.columnAllCorrectRateAverage,
      primaryKeyAccuracyAverage: result.primaryKeyAccuracyAverage,
      constraintAccuracy: result.constraintAccuracy,
      foreignKeyF1Score: result.foreignKeyF1Score,
      foreignKeyAllCorrectRate: result.foreignKeyAllCorrectRate,
      overallSchemaAccuracy: result.overallSchemaAccuracy,
    },
    tableMapping: result.tableMapping,
    columnMappings: result.columnMappings,
  }))
}
