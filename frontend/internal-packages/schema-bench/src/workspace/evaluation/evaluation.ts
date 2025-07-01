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

const readJsonFile = (filePath: string): WorkspaceResult<Schema> => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return ok(JSON.parse(content) as Schema)
  } catch (error) {
    return err({
      type: 'JSON_PARSE_ERROR',
      path: filePath,
      cause: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const processSchemaFiles = (
  dirPath: string,
  files: string[],
): WorkspaceResult<Map<string, Schema>> => {
  const schemaData = new Map<string, Schema>()
  for (const file of files) {
    const caseId = path.basename(file, '.json')
    const filePath = path.join(dirPath, file)
    const schemaResult = readJsonFile(filePath)
    if (schemaResult.isErr()) return err(schemaResult.error)
    schemaData.set(caseId, schemaResult.value)
  }
  return ok(schemaData)
}

const loadSchemaData = (
  dirPath: string,
): WorkspaceResult<Map<string, Schema>> => {
  if (!fs.existsSync(dirPath)) {
    return err({ type: 'DIRECTORY_NOT_FOUND', path: dirPath })
  }
  try {
    const files = fs
      .readdirSync(dirPath)
      .filter((file) => file.endsWith('.json'))
    return processSchemaFiles(dirPath, files)
  } catch (error) {
    return err({
      type: 'FILE_READ_ERROR',
      path: dirPath,
      cause: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const loadOutputData = (
  workspacePath: string,
): WorkspaceResult<Map<string, Schema>> => {
  const outputDir = path.join(workspacePath, 'execution', 'output')
  return loadSchemaData(outputDir)
}

const loadReferenceData = (
  workspacePath: string,
): WorkspaceResult<Map<string, Schema>> => {
  const referenceDir = path.join(workspacePath, 'execution', 'reference')
  return loadSchemaData(referenceDir)
}

const createEvaluationResult = (
  caseData: CaseData,
  result: Awaited<ReturnType<typeof evaluate>>,
): EvaluationResult => ({
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
})

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
  ).map((result) => createEvaluationResult(caseData, result))
}

const calculateMetricAverage = (
  results: EvaluationResult[],
  metricKey: keyof EvaluationResult['metrics'],
) => results.reduce((sum, r) => sum + r.metrics[metricKey], 0) / results.length

const calculateAverageMetrics = (results: EvaluationResult[]) => {
  const metricKeys = [
    'tableF1Score',
    'tableAllCorrectRate',
    'columnF1ScoreAverage',
    'columnAllCorrectRateAverage',
    'primaryKeyAccuracyAverage',
    'constraintAccuracy',
    'foreignKeyF1Score',
    'foreignKeyAllCorrectRate',
    'overallSchemaAccuracy',
  ] as const

  return Object.fromEntries(
    metricKeys.map((key) => [key, calculateMetricAverage(results, key)]),
  )
}

const writeJsonFile = (
  filePath: string,
  data: unknown,
): WorkspaceResult<void> => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    return ok(undefined)
  } catch (error) {
    return err({
      type: 'FILE_WRITE_ERROR',
      path: filePath,
      cause: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const saveIndividualResult = (
  result: EvaluationResult,
  evaluationDir: string,
): WorkspaceResult<void> => {
  const filename = `${result.caseId}_results_${result.timestamp.replace(/[:.]/g, '-')}.json`
  const filePath = path.join(evaluationDir, filename)
  return writeJsonFile(filePath, result)
}

const saveIndividualResults = (
  results: EvaluationResult[],
  evaluationDir: string,
): WorkspaceResult<void> => {
  for (const result of results) {
    const writeResult = saveIndividualResult(result, evaluationDir)
    if (writeResult.isErr()) return writeResult
  }
  return ok(undefined)
}

const createSummaryData = (results: EvaluationResult[]) => ({
  timestamp: new Date().toISOString(),
  totalCases: results.length,
  averageMetrics: calculateAverageMetrics(results),
  cases: results.map((r) => ({
    caseId: r.caseId,
    overallSchemaAccuracy: r.metrics.overallSchemaAccuracy,
  })),
})

const saveSummaryResult = (
  results: EvaluationResult[],
  evaluationDir: string,
): WorkspaceResult<void> => {
  const summaryResult = createSummaryData(results)
  const summaryFilename = `summary_results_${summaryResult.timestamp.replace(/[:.]/g, '-')}.json`
  const summaryFilePath = path.join(evaluationDir, summaryFilename)
  return writeJsonFile(summaryFilePath, summaryResult)
}

const ensureEvaluationDir = (evaluationDir: string): WorkspaceResult<void> => {
  try {
    if (!fs.existsSync(evaluationDir)) {
      fs.mkdirSync(evaluationDir, { recursive: true })
    }
    return ok(undefined)
  } catch (error) {
    return err({
      type: 'FILE_WRITE_ERROR',
      path: evaluationDir,
      cause: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const saveResults = (
  results: EvaluationResult[],
  workspacePath: string,
): WorkspaceResult<void> => {
  const evaluationDir = path.join(workspacePath, 'evaluation')
  const dirResult = ensureEvaluationDir(evaluationDir)
  if (dirResult.isErr()) return dirResult

  const individualResult = saveIndividualResults(results, evaluationDir)
  if (individualResult.isErr()) return individualResult

  if (results.length > 1) {
    return saveSummaryResult(results, evaluationDir)
  }
  return ok(undefined)
}

const displaySummary = (results: EvaluationResult[]): void => {
  if (results.length === 0) return
}

const validateDirectories = (
  config: EvaluationConfig,
): WorkspaceResult<void> => {
  const outputDir = path.join(config.workspacePath, 'execution', 'output')
  const referenceDir = path.join(config.workspacePath, 'execution', 'reference')
  if (!fs.existsSync(outputDir))
    return err({ type: 'DIRECTORY_NOT_FOUND', path: outputDir })
  if (!fs.existsSync(referenceDir))
    return err({ type: 'DIRECTORY_NOT_FOUND', path: referenceDir })
  return ok(undefined)
}

const prepareCasesToEvaluate = (
  config: EvaluationConfig,
  outputData: Map<string, Schema>,
  referenceData: Map<string, Schema>,
): WorkspaceResult<CaseData[]> => {
  if (config.caseId) {
    const caseId = config.caseId
    const outputSchema = outputData.get(caseId)
    const referenceSchema = referenceData.get(caseId)
    if (!outputSchema)
      return err({ type: 'SCHEMA_NOT_FOUND', caseId, schemaType: 'output' })
    if (!referenceSchema)
      return err({ type: 'SCHEMA_NOT_FOUND', caseId, schemaType: 'reference' })
    return ok([{ caseId, outputSchema, referenceSchema }])
  }

  const casesToEvaluate: CaseData[] = []
  for (const [caseId, outputSchema] of outputData) {
    const referenceSchema = referenceData.get(caseId)
    if (referenceSchema) {
      casesToEvaluate.push({ caseId, outputSchema, referenceSchema })
    } else {
      console.warn(`⚠️  No reference schema found for case: ${caseId}`)
    }
  }
  return ok(casesToEvaluate)
}

const loadDataAndPrepare = async (
  config: EvaluationConfig,
): Promise<WorkspaceResult<CaseData[]>> => {
  const outputDataResult = loadOutputData(config.workspacePath)
  if (outputDataResult.isErr()) return err(outputDataResult.error)
  const referenceDataResult = loadReferenceData(config.workspacePath)
  if (referenceDataResult.isErr()) return err(referenceDataResult.error)
  return prepareCasesToEvaluate(
    config,
    outputDataResult.value,
    referenceDataResult.value,
  )
}

const runEvaluations = async (
  casesToEvaluate: CaseData[],
): Promise<WorkspaceResult<EvaluationResult[]>> => {
  const evaluationResults = await ResultAsync.combine(
    casesToEvaluate.map((caseData) => runEvaluation(caseData)),
  )
  if (evaluationResults.isErr()) return err(evaluationResults.error)
  return ok(evaluationResults.value)
}

const validateAndPrepare = async (
  config: EvaluationConfig,
): Promise<WorkspaceResult<CaseData[]>> => {
  const validationResult = validateDirectories(config)
  if (validationResult.isErr()) return err(validationResult.error)
  const casesResult = await loadDataAndPrepare(config)
  if (casesResult.isErr()) return err(casesResult.error)
  const casesToEvaluate = casesResult.value
  if (casesToEvaluate.length === 0) {
    return err({
      type: 'VALIDATION_ERROR',
      message:
        'No cases to evaluate. Make sure output and reference schemas exist.',
    })
  }
  return ok(casesToEvaluate)
}

export const evaluateSchema = async (
  config: EvaluationConfig,
): Promise<WorkspaceResult<EvaluationResult[]>> => {
  const casesResult = await validateAndPrepare(config)
  if (casesResult.isErr()) return err(casesResult.error)
  const resultsResult = await runEvaluations(casesResult.value)
  if (resultsResult.isErr()) return err(resultsResult.error)
  const results = resultsResult.value
  const saveResult = saveResults(results, config.workspacePath)
  if (saveResult.isErr()) return err(saveResult.error)
  displaySummary(results)
  return ok(results)
}
