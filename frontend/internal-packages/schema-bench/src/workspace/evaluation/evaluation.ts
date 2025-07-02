import { err } from 'neverthrow'
import type {
  EvaluationConfig,
  EvaluationResult,
  WorkspaceResult,
} from '../types'
import { loadAndPrepareData, runAllEvaluations } from './orchestrator.ts'
import { saveResults } from './resultsSaver.ts'
import { validateDirectories } from './validator.ts'

export const evaluateSchema = async (
  config: EvaluationConfig,
): Promise<WorkspaceResult<EvaluationResult[]>> => {
  // Validate directories
  const validationResult = validateDirectories(config)
  if (validationResult.isErr()) {
    return err(validationResult.error)
  }

  // Load and prepare data
  const dataResult = loadAndPrepareData(config)
  if (dataResult.isErr()) {
    return err(dataResult.error)
  }

  // Run evaluations
  const results = await runAllEvaluations(dataResult.value.casesToEvaluate)
  if (results.isErr()) {
    return err(results.error)
  }

  // Save results
  const saveResult = saveResults(results.value, config.workspacePath)
  if (saveResult.isErr()) {
    return err(saveResult.error)
  }

  return results
}
