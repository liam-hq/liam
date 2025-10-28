import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import * as path from 'node:path'
import { err, ok, Result, ResultAsync } from '@liam-hq/neverthrow'
import { type Schema, schemaSchema } from '@liam-hq/schema'
import * as v from 'valibot'
import { evaluate } from '../../evaluate/evaluate.ts'
import { formatError } from '../../shared/formatError.ts'
import type {
  CaseData,
  EvaluationConfig,
  EvaluationResult,
  WorkspaceError,
  WorkspaceResult,
} from '../types'

// Safe wrapper functions using Result.fromThrowable
const safeReadDirSync = (dirPath: string) =>
  Result.fromThrowable(
    () => readdirSync(dirPath, { encoding: 'utf8' }),
    (error): WorkspaceError => ({
      type: 'FILE_READ_ERROR',
      path: dirPath,
      cause: error instanceof Error ? error.message : 'Unknown error',
    }),
  )()

const safeReadFileSync = (filePath: string, encoding: BufferEncoding) =>
  Result.fromThrowable(
    () => readFileSync(filePath, encoding),
    (error): WorkspaceError => ({
      type: 'FILE_READ_ERROR',
      path: filePath,
      cause: error instanceof Error ? error.message : 'Unknown error',
    }),
  )()

const safeJsonParse = (content: string, filePath: string) =>
  Result.fromThrowable(
    () => JSON.parse(content),
    (error): WorkspaceError => ({
      type: 'JSON_PARSE_ERROR',
      path: filePath,
      cause: error instanceof Error ? error.message : 'Unknown error',
    }),
  )()

// Helper function to process a single schema file
const processSchemaFile = (
  file: string,
  baseDir: string,
): Result<{ caseId: string; schema: Schema }, WorkspaceError> => {
  const caseId = path.basename(file, '.json')
  const filePath = path.join(baseDir, file)

  const contentResult = safeReadFileSync(filePath, 'utf-8')
  if (contentResult.isErr()) {
    return err(contentResult.error)
  }

  const parseResult = safeJsonParse(contentResult.value, filePath)
  if (parseResult.isErr()) {
    return err(parseResult.error)
  }

  const validationResult = v.safeParse(schemaSchema, parseResult.value)
  if (!validationResult.success) {
    return err({
      type: 'JSON_PARSE_ERROR',
      path: filePath,
      cause: `Invalid schema format: ${validationResult.issues[0]?.message || 'Unknown validation error'}`,
    })
  }

  return ok({ caseId, schema: validationResult.output })
}

// Helper function to handle failed files and determine error response
const handleProcessingResults = (
  results: Array<{
    file: string
    result: Result<{ caseId: string; schema: Schema }, WorkspaceError>
  }>,
  dirPath: string,
): WorkspaceResult<Map<string, Schema>> => {
  const dataMap = new Map<string, Schema>()
  const failedFiles: Array<{ file: string; error: WorkspaceError }> = []

  for (const { file, result } of results) {
    if (result.isOk()) {
      dataMap.set(result.value.caseId, result.value.schema)
    } else {
      failedFiles.push({ file, error: result.error })
    }
  }

  // Log warnings for failed files
  if (failedFiles.length > 0) {
    console.warn(`⚠️  Failed to load ${failedFiles.length} file(s):`)
    for (const failed of failedFiles) {
      console.warn(`   - ${failed.file}: ${formatError(failed.error)}`)
    }
  }

  // If all files failed, return error
  if (dataMap.size === 0 && results.length > 0) {
    if (
      failedFiles.length > 0 &&
      failedFiles.every((f) => f.error.type === failedFiles[0]?.error.type)
    ) {
      const firstError = failedFiles[0]?.error
      if (firstError) {
        return err(firstError)
      }
    }
    return err({
      type: 'VALIDATION_ERROR',
      message: `Failed to load any files from ${dirPath}`,
    })
  }

  return ok(dataMap)
}

const loadOutputDataAt = (
  outputDir: string,
): WorkspaceResult<Map<string, Schema>> => {
  if (!existsSync(outputDir)) {
    return err({ type: 'DIRECTORY_NOT_FOUND', path: outputDir })
  }

  const filesResult = safeReadDirSync(outputDir).map((files) =>
    files.filter((file) => file.endsWith('.json')),
  )
  if (filesResult.isErr()) {
    return err(filesResult.error)
  }

  const results = filesResult.value.map((file) => ({
    file,
    result: processSchemaFile(file, outputDir),
  }))

  return handleProcessingResults(results, outputDir)
}

const loadReferenceData = (
  workspacePath: string,
): WorkspaceResult<Map<string, Schema>> => {
  const referenceDir = path.join(workspacePath, 'execution', 'reference')

  if (!existsSync(referenceDir)) {
    return err({ type: 'DIRECTORY_NOT_FOUND', path: referenceDir })
  }

  const filesResult = safeReadDirSync(referenceDir).map((files) =>
    files.filter((file) => file.endsWith('.json')),
  )
  if (filesResult.isErr()) {
    return err(filesResult.error)
  }

  const results = filesResult.value.map((file) => ({
    file,
    result: processSchemaFile(file, referenceDir),
  }))

  return handleProcessingResults(results, referenceDir)
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
      tableRecall: result.tableRecall,
      columnF1ScoreAverage: result.columnF1ScoreAverage,
      columnRecallAverage: result.columnRecallAverage,
      columnAllCorrectRateAverage: result.columnAllCorrectRateAverage,
      foreignKeyF1Score: result.foreignKeyF1Score,
      foreignKeyRecall: result.foreignKeyRecall,
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
    tableRecall:
      results.reduce((sum, r) => sum + r.metrics.tableRecall, 0) / length,
    columnF1ScoreAverage:
      results.reduce((sum, r) => sum + r.metrics.columnF1ScoreAverage, 0) /
      length,
    columnRecallAverage:
      results.reduce((sum, r) => sum + r.metrics.columnRecallAverage, 0) /
      length,
    columnAllCorrectRateAverage:
      results.reduce(
        (sum, r) => sum + r.metrics.columnAllCorrectRateAverage,
        0,
      ) / length,
    foreignKeyF1Score:
      results.reduce((sum, r) => sum + r.metrics.foreignKeyF1Score, 0) / length,
    foreignKeyRecall:
      results.reduce((sum, r) => sum + r.metrics.foreignKeyRecall, 0) / length,
  }
}

const saveIndividualResults = (
  results: EvaluationResult[],
  evaluationDir: string,
): WorkspaceResult<void> => {
  for (const result of results) {
    const filename = `${result.caseId}_results_${result.timestamp.replace(/[:.]/g, '-')}.json`
    const filePath = path.join(evaluationDir, filename)

    const writeResult = Result.fromThrowable(
      () => writeFileSync(filePath, JSON.stringify(result, null, 2)),
      (error): WorkspaceError => ({
        type: 'FILE_WRITE_ERROR',
        path: filePath,
        cause: error instanceof Error ? error.message : 'Unknown error',
      }),
    )()

    if (writeResult.isErr()) {
      return err(writeResult.error)
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
    })),
  }

  const summaryFilename = `summary_results_${summaryResult.timestamp.replace(/[:.]/g, '-')}.json`
  const summaryFilePath = path.join(evaluationDir, summaryFilename)

  const writeResult = Result.fromThrowable(
    () =>
      writeFileSync(summaryFilePath, JSON.stringify(summaryResult, null, 2)),
    (error): WorkspaceError => ({
      type: 'FILE_WRITE_ERROR',
      path: summaryFilePath,
      cause: error instanceof Error ? error.message : 'Unknown error',
    }),
  )()

  if (writeResult.isErr()) {
    return err(writeResult.error)
  }
  return ok(undefined)
}

const saveResultsAt = (
  results: EvaluationResult[],
  evaluationDir: string,
): WorkspaceResult<void> => {
  if (!existsSync(evaluationDir)) {
    const mkdirResult = Result.fromThrowable(
      () => mkdirSync(evaluationDir, { recursive: true }),
      (error): WorkspaceError => ({
        type: 'FILE_WRITE_ERROR',
        path: evaluationDir,
        cause: error instanceof Error ? error.message : 'Unknown error',
      }),
    )()

    if (mkdirResult.isErr()) {
      return err(mkdirResult.error)
    }
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

  if (!existsSync(outputDir)) {
    return err({ type: 'DIRECTORY_NOT_FOUND', path: outputDir })
  }

  if (!existsSync(referenceDir)) {
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
  const outputDataResult = loadOutputDataAt(
    path.join(config.workspacePath, 'execution', 'output'),
  )
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

  // Run evaluations with partial failure handling
  const evaluationPromises = casesToEvaluate.map(async (caseData) => {
    const result = await runEvaluation(caseData)
    return { caseData, result }
  })

  const evaluationOutcomes = await Promise.all(evaluationPromises)

  const successfulResults: EvaluationResult[] = []
  const failedCases: Array<{ caseId: string; error: WorkspaceError }> = []

  for (const outcome of evaluationOutcomes) {
    if (outcome.result.isOk()) {
      successfulResults.push(outcome.result.value)
    } else {
      failedCases.push({
        caseId: outcome.caseData.caseId,
        error: outcome.result.error,
      })
    }
  }

  // If all evaluations failed, return error
  if (successfulResults.length === 0) {
    return err({
      type: 'EVALUATION_ERROR',
      caseId: failedCases.map((failed) => failed.caseId).join(', '),
      cause: `All ${failedCases.length} evaluation(s) failed`,
    })
  }

  // Log warnings for failed cases but continue with successful ones
  for (const failed of failedCases) {
    console.warn(
      `⚠️  Failed evaluation - ${failed.caseId}: ${formatError(failed.error)}`,
    )
  }

  const results = successfulResults

  // Save results
  const saveResult = saveResultsAt(
    results,
    path.join(config.workspacePath, 'evaluation'),
  )
  if (saveResult.isErr()) {
    return err(saveResult.error)
  }

  displaySummary(results)
  return ok(results)
}

export const evaluateSchemaAtOutputDir = async (
  config: EvaluationConfig,
  outputDir: string,
  scopeSubdir?: string, // e.g. runs/<RUN_ID>--<executor>
): Promise<WorkspaceResult<EvaluationResult[]>> => {
  // Validate reference directory only; outputDir is custom
  const referenceDir = path.join(config.workspacePath, 'execution', 'reference')
  if (!existsSync(referenceDir)) {
    return err({ type: 'DIRECTORY_NOT_FOUND', path: referenceDir })
  }
  if (!existsSync(outputDir)) {
    return err({ type: 'DIRECTORY_NOT_FOUND', path: outputDir })
  }

  const outputDataResult = loadOutputDataAt(outputDir)
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

  const evaluationPromises = casesToEvaluate.map(async (caseData) => {
    const result = await runEvaluation(caseData)
    return { caseData, result }
  })

  const evaluationOutcomes = await Promise.all(evaluationPromises)

  const successfulResults: EvaluationResult[] = []
  const failedCases: Array<{ caseId: string; error: WorkspaceError }> = []

  for (const outcome of evaluationOutcomes) {
    if (outcome.result.isOk()) {
      successfulResults.push(outcome.result.value)
    } else {
      failedCases.push({
        caseId: outcome.caseData.caseId,
        error: outcome.result.error,
      })
    }
  }

  if (successfulResults.length === 0) {
    return err({
      type: 'EVALUATION_ERROR',
      caseId: failedCases.map((failed) => failed.caseId).join(', '),
      cause: `All ${failedCases.length} evaluation(s) failed`,
    })
  }

  if (failedCases.length > 0) {
    console.warn(`⚠️  ${failedCases.length} case(s) failed evaluation:`)
    for (const failed of failedCases) {
      console.warn(`   - ${failed.caseId}: ${formatError(failed.error)}`)
    }
  }

  const evaluationDir = scopeSubdir
    ? path.join(config.workspacePath, 'evaluation', scopeSubdir)
    : path.join(config.workspacePath, 'evaluation')
  const saveResult = saveResultsAt(successfulResults, evaluationDir)
  if (saveResult.isErr()) {
    return err(saveResult.error)
  }

  displaySummary(successfulResults)
  return ok(successfulResults)
}
