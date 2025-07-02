import { err, ok, ResultAsync } from 'neverthrow'
import type {
  CaseData,
  EvaluationConfig,
  EvaluationResult,
  WorkspaceResult,
} from '../types'
import { prepareCasesToEvaluate } from './casesPreparer.ts'
import { loadOutputData, loadReferenceData } from './dataLoader.ts'
import { runEvaluation } from './evaluationRunner.ts'

export const loadAndPrepareData = (
  config: EvaluationConfig,
): WorkspaceResult<{ casesToEvaluate: CaseData[] }> => {
  // Load output data
  const outputDataResult = loadOutputData(config.workspacePath)
  if (outputDataResult.isErr()) {
    return err(outputDataResult.error)
  }

  // Load reference data
  const referenceDataResult = loadReferenceData(config.workspacePath)
  if (referenceDataResult.isErr()) {
    return err(referenceDataResult.error)
  }

  // Prepare cases
  const casesResult = prepareCasesToEvaluate(
    config,
    outputDataResult.value,
    referenceDataResult.value,
  )
  if (casesResult.isErr()) {
    return err(casesResult.error)
  }

  const casesToEvaluate = casesResult.value
  if (casesToEvaluate.length === 0) {
    return err({
      type: 'VALIDATION_ERROR',
      message:
        'No cases to evaluate. Make sure output and reference schemas exist.',
    })
  }

  return ok({ casesToEvaluate })
}

export const runAllEvaluations = async (
  casesToEvaluate: Parameters<typeof runEvaluation>[0][],
): Promise<WorkspaceResult<EvaluationResult[]>> => {
  const evaluationResults = await ResultAsync.combine(
    casesToEvaluate.map((caseData) => runEvaluation(caseData)),
  )

  if (evaluationResults.isErr()) {
    return err(evaluationResults.error)
  }

  return ok(evaluationResults.value)
}
