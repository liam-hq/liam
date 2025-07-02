import { err, ok, ResultAsync } from 'neverthrow'
import type {
  CaseData,
  EvaluationConfig,
  EvaluationResult,
  WorkspaceResult,
} from '../../types'
import { prepareCasesToEvaluate } from '../casePreparation/casePreparation'
import { loadOutputData, loadReferenceData } from '../dataLoader/dataLoader'
import { runEvaluation } from '../evaluationRunner/evaluationRunner'
import { validateDirectories } from '../validator/validator'

export const loadAndPrepareCases = (
  config: EvaluationConfig,
): WorkspaceResult<{
  cases: CaseData[]
  workspacePath: string
}> => {
  const validationResult = validateDirectories(config)
  if (validationResult.isErr()) {
    return err(validationResult.error)
  }

  const outputDataResult = loadOutputData(config.workspacePath)
  if (outputDataResult.isErr()) {
    return err(outputDataResult.error)
  }

  const referenceDataResult = loadReferenceData(config.workspacePath)
  if (referenceDataResult.isErr()) {
    return err(referenceDataResult.error)
  }

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

  return ok({ cases: casesToEvaluate, workspacePath: config.workspacePath })
}

export const runAllEvaluations = async (
  cases: CaseData[],
): Promise<WorkspaceResult<EvaluationResult[]>> => {
  const evaluationResults = await ResultAsync.combine(
    cases.map((caseData) => runEvaluation(caseData)),
  )

  if (evaluationResults.isErr()) {
    return err(evaluationResults.error)
  }

  return ok(evaluationResults.value)
}
