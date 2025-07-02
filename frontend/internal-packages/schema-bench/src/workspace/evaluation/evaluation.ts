import { err, ok } from 'neverthrow'
import type {
  EvaluationConfig,
  EvaluationResult,
  WorkspaceResult,
} from '../types'
import {
  loadAndPrepareCases,
  runAllEvaluations,
} from './orchestrator/orchestrator'
import { displaySummary, saveResults } from './resultSaver/resultSaver'

export const evaluateSchema = async (
  config: EvaluationConfig,
): Promise<WorkspaceResult<EvaluationResult[]>> => {
  const prepareResult = loadAndPrepareCases(config)
  if (prepareResult.isErr()) {
    return err(prepareResult.error)
  }

  const { cases, workspacePath } = prepareResult.value

  const evaluationResults = await runAllEvaluations(cases)
  if (evaluationResults.isErr()) {
    return err(evaluationResults.error)
  }

  const results = evaluationResults.value

  const saveResult = saveResults(results, workspacePath)
  if (saveResult.isErr()) {
    return err(saveResult.error)
  }

  displaySummary(results)
  return ok(results)
}
