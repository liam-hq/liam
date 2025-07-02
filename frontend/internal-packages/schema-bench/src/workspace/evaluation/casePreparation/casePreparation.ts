import type { Schema } from '@liam-hq/db-structure'
import { err, ok } from 'neverthrow'
import type { CaseData, EvaluationConfig, WorkspaceResult } from '../../types'

const prepareCasesForSpecificCase = (
  config: EvaluationConfig,
  outputData: Map<string, Schema>,
  referenceData: Map<string, Schema>,
): WorkspaceResult<CaseData[]> => {
  const caseId = config.caseId
  if (!caseId) {
    return err({
      type: 'VALIDATION_ERROR',
      message: 'Case ID is required for specific case evaluation',
    })
  }

  const outputSchema = outputData.get(caseId)
  const referenceSchema = referenceData.get(caseId)

  if (!outputSchema) {
    return err({ type: 'SCHEMA_NOT_FOUND', caseId, schemaType: 'output' })
  }
  if (!referenceSchema) {
    return err({ type: 'SCHEMA_NOT_FOUND', caseId, schemaType: 'reference' })
  }

  return ok([
    {
      caseId,
      outputSchema,
      referenceSchema,
    },
  ])
}

const prepareCasesForAllCases = (
  outputData: Map<string, Schema>,
  referenceData: Map<string, Schema>,
): WorkspaceResult<CaseData[]> => {
  const casesToEvaluate: CaseData[] = []

  for (const [caseId, outputSchema] of outputData) {
    const referenceSchema = referenceData.get(caseId)
    if (referenceSchema) {
      casesToEvaluate.push({
        caseId,
        outputSchema,
        referenceSchema,
      })
    } else {
      console.warn(`⚠️  No reference schema found for case: ${caseId}`)
    }
  }

  return ok(casesToEvaluate)
}

export const prepareCasesToEvaluate = (
  config: EvaluationConfig,
  outputData: Map<string, Schema>,
  referenceData: Map<string, Schema>,
): WorkspaceResult<CaseData[]> => {
  if (config.caseId) {
    return prepareCasesForSpecificCase(config, outputData, referenceData)
  }
  return prepareCasesForAllCases(outputData, referenceData)
}
