import * as fs from 'node:fs'
import * as path from 'node:path'
import { err, ok } from 'neverthrow'
import type { EvaluationResult, WorkspaceResult } from '../../types'
import { calculateAverageMetrics } from '../metricsCalculator/metricsCalculator'

const saveIndividualResults = (
  results: EvaluationResult[],
  evaluationDir: string,
): WorkspaceResult<void> => {
  for (const result of results) {
    const filename = `${result.caseId}_results_${result.timestamp.replace(/[:.]/g, '-')}.json`
    const filePath = path.join(evaluationDir, filename)

    try {
      fs.writeFileSync(filePath, JSON.stringify(result, null, 2))
    } catch (error) {
      return err({
        type: 'FILE_WRITE_ERROR',
        path: filePath,
        cause: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
  return ok(undefined)
}

const saveSummaryResult = (
  results: EvaluationResult[],
  evaluationDir: string,
): WorkspaceResult<void> => {
  const summaryResult = {
    timestamp: new Date().toISOString(),
    totalCases: results.length,
    averageMetrics: calculateAverageMetrics(results),
    cases: results.map((r) => ({
      caseId: r.caseId,
      overallSchemaAccuracy: r.metrics.overallSchemaAccuracy,
    })),
  }

  const summaryFilename = `summary_results_${summaryResult.timestamp.replace(/[:.]/g, '-')}.json`
  const summaryFilePath = path.join(evaluationDir, summaryFilename)

  try {
    fs.writeFileSync(summaryFilePath, JSON.stringify(summaryResult, null, 2))
    return ok(undefined)
  } catch (error) {
    return err({
      type: 'FILE_WRITE_ERROR',
      path: summaryFilePath,
      cause: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export const saveResults = (
  results: EvaluationResult[],
  workspacePath: string,
): WorkspaceResult<void> => {
  const evaluationDir = path.join(workspacePath, 'evaluation')

  try {
    if (!fs.existsSync(evaluationDir)) {
      fs.mkdirSync(evaluationDir, { recursive: true })
    }
  } catch (error) {
    return err({
      type: 'FILE_WRITE_ERROR',
      path: evaluationDir,
      cause: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  const individualResult = saveIndividualResults(results, evaluationDir)
  if (individualResult.isErr()) {
    return individualResult
  }

  if (results.length > 1) {
    const summaryResult = saveSummaryResult(results, evaluationDir)
    if (summaryResult.isErr()) {
      return summaryResult
    }
  }

  return ok(undefined)
}

export const displaySummary = (results: EvaluationResult[]): void => {
  if (results.length === 0) {
    return
  }
}
