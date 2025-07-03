import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Schema } from '@liam-hq/db-structure'
import { err, ok, ResultAsync } from 'neverthrow'
import { evaluate } from '../../evaluate/evaluate.ts'
import type {
  CaseData,
  EvaluationConfig,
  EvaluationResult,
  WorkspaceError,
  WorkspaceResult,
} from '../types'

const loadOutputData = (
  workspacePath: string,
): WorkspaceResult<Map<string, Schema>> => {
  const outputDir = path.join(workspacePath, 'execution', 'output')
  const outputData = new Map<string, Schema>()

  if (!fs.existsSync(outputDir)) {
    return err({ type: 'DIRECTORY_NOT_FOUND', path: outputDir })
  }

  try {
    const files = fs
      .readdirSync(outputDir)
      .filter((file) => file.endsWith('.json'))

    for (const file of files) {
      const caseId = path.basename(file, '.json')
      const filePath = path.join(outputDir, file)

      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const schema = JSON.parse(content) as Schema
        outputData.set(caseId, schema)
      } catch (error) {
        return err({
          type: 'JSON_PARSE_ERROR',
          path: filePath,
          cause: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return ok(outputData)
  } catch (error) {
    return err({
      type: 'FILE_READ_ERROR',
      path: outputDir,
      cause: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const loadReferenceData = (
  workspacePath: string,
): WorkspaceResult<Map<string, Schema>> => {
  const referenceDir = path.join(workspacePath, 'execution', 'reference')
  const referenceData = new Map<string, Schema>()

  if (!fs.existsSync(referenceDir)) {
    return err({ type: 'DIRECTORY_NOT_FOUND', path: referenceDir })
  }

  try {
    const files = fs
      .readdirSync(referenceDir)
      .filter((file) => file.endsWith('.json'))

    for (const file of files) {
      const caseId = path.basename(file, '.json')
      const filePath = path.join(referenceDir, file)

      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const schema = JSON.parse(content) as Schema
        referenceData.set(caseId, schema)
      } catch (error) {
        return err({
          type: 'JSON_PARSE_ERROR',
          path: filePath,
          cause: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return ok(referenceData)
  } catch (error) {
    return err({
      type: 'FILE_READ_ERROR',
      path: referenceDir,
      cause: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const runEvaluation = (
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

const calculateAverageMetrics = (results: EvaluationResult[]) => {
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

const saveResults = (
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

  // Save individual results
  const individualResult = saveIndividualResults(results, evaluationDir)
  if (individualResult.isErr()) {
    return individualResult
  }

  // Save summary if multiple results
  if (results.length > 1) {
    const summaryResult = saveSummaryResult(results, evaluationDir)
    if (summaryResult.isErr()) {
      return summaryResult
    }
  }

  return ok(undefined)
}

const displaySummary = (results: EvaluationResult[]): void => {
  if (results.length === 0) {
    return
  }
}

const validateDirectories = (
  config: EvaluationConfig,
): WorkspaceResult<void> => {
  const outputDir = path.join(config.workspacePath, 'execution', 'output')
  const referenceDir = path.join(config.workspacePath, 'execution', 'reference')

  if (!fs.existsSync(outputDir)) {
    return err({ type: 'DIRECTORY_NOT_FOUND', path: outputDir })
  }

  if (!fs.existsSync(referenceDir)) {
    return err({ type: 'DIRECTORY_NOT_FOUND', path: referenceDir })
  }

  return ok(undefined)
}

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

const prepareCasesToEvaluate = (
  config: EvaluationConfig,
  outputData: Map<string, Schema>,
  referenceData: Map<string, Schema>,
): WorkspaceResult<CaseData[]> => {
  if (config.caseId) {
    return prepareCasesForSpecificCase(config, outputData, referenceData)
  }
  return prepareCasesForAllCases(outputData, referenceData)
}

export const evaluateSchema = async (
  config: EvaluationConfig,
): Promise<WorkspaceResult<EvaluationResult[]>> => {
  // Validate directories
  const validationResult = validateDirectories(config)
  if (validationResult.isErr()) {
    return err(validationResult.error)
  }

  // Load data
  const outputDataResult = loadOutputData(config.workspacePath)
  if (outputDataResult.isErr()) {
    return err(outputDataResult.error)
  }

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

  // Run evaluations
  const evaluationResults = await ResultAsync.combine(
    casesToEvaluate.map((caseData) => runEvaluation(caseData)),
  )

  if (evaluationResults.isErr()) {
    return err(evaluationResults.error)
  }

  const results = evaluationResults.value

  // Save results
  const saveResult = saveResults(results, config.workspacePath)
  if (saveResult.isErr()) {
    return err(saveResult.error)
  }

  displaySummary(results)
  return ok(results)
}
