import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Schema } from '@liam-hq/db-structure'
import { evaluate } from '../../evaluate/evaluate.ts'
import type { CaseData, EvaluationConfig, EvaluationResult } from '../types'

const loadOutputData = (workspacePath: string): Map<string, Schema> => {
  const outputDir = path.join(workspacePath, 'execution', 'output')
  const outputData = new Map<string, Schema>()

  if (!fs.existsSync(outputDir)) {
    throw new Error(`Output directory does not exist: ${outputDir}`)
  }

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
      console.error(`❌ Failed to load output file ${file}:`, error)
      throw error
    }
  }

  return outputData
}

const loadReferenceData = (workspacePath: string): Map<string, Schema> => {
  const referenceDir = path.join(workspacePath, 'execution', 'reference')
  const referenceData = new Map<string, Schema>()

  if (!fs.existsSync(referenceDir)) {
    throw new Error(`Reference directory does not exist: ${referenceDir}`)
  }

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
      console.error(`❌ Failed to load reference file ${file}:`, error)
      throw error
    }
  }

  return referenceData
}

const runEvaluation = async (caseData: CaseData): Promise<EvaluationResult> => {
  const result = await evaluate(caseData.referenceSchema, caseData.outputSchema)

  const evaluationResult: EvaluationResult = {
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
  }

  return evaluationResult
}

const calculateTableMetrics = (
  results: EvaluationResult[],
  resultsLength: number,
) => ({
  tableF1Score:
    results.reduce((sum, r) => sum + r.metrics.tableF1Score, 0) / resultsLength,
  tableAllCorrectRate:
    results.reduce((sum, r) => sum + r.metrics.tableAllCorrectRate, 0) /
    resultsLength,
})

const calculateColumnMetrics = (
  results: EvaluationResult[],
  resultsLength: number,
) => ({
  columnF1ScoreAverage:
    results.reduce((sum, r) => sum + r.metrics.columnF1ScoreAverage, 0) /
    resultsLength,
  columnAllCorrectRateAverage:
    results.reduce((sum, r) => sum + r.metrics.columnAllCorrectRateAverage, 0) /
    resultsLength,
})

const calculateKeyAndConstraintMetrics = (
  results: EvaluationResult[],
  resultsLength: number,
) => ({
  primaryKeyAccuracyAverage:
    results.reduce((sum, r) => sum + r.metrics.primaryKeyAccuracyAverage, 0) /
    resultsLength,
  constraintAccuracy:
    results.reduce((sum, r) => sum + r.metrics.constraintAccuracy, 0) /
    resultsLength,
  foreignKeyF1Score:
    results.reduce((sum, r) => sum + r.metrics.foreignKeyF1Score, 0) /
    resultsLength,
  foreignKeyAllCorrectRate:
    results.reduce((sum, r) => sum + r.metrics.foreignKeyAllCorrectRate, 0) /
    resultsLength,
})

const calculateAverageMetrics = (results: EvaluationResult[]) => {
  const resultsLength = results.length
  return {
    ...calculateTableMetrics(results, resultsLength),
    ...calculateColumnMetrics(results, resultsLength),
    ...calculateKeyAndConstraintMetrics(results, resultsLength),
    overallSchemaAccuracy:
      results.reduce((sum, r) => sum + r.metrics.overallSchemaAccuracy, 0) /
      resultsLength,
  }
}

const saveSummaryResult = (
  results: EvaluationResult[],
  evaluationDir: string,
): void => {
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

  fs.writeFileSync(summaryFilePath, JSON.stringify(summaryResult, null, 2))
}

const saveIndividualResults = (
  results: EvaluationResult[],
  evaluationDir: string,
): void => {
  for (const result of results) {
    const filename = `${result.caseId}_results_${result.timestamp.replace(/[:.]/g, '-')}.json`
    const filePath = path.join(evaluationDir, filename)

    fs.writeFileSync(filePath, JSON.stringify(result, null, 2))
  }
}

const saveResults = (
  results: EvaluationResult[],
  workspacePath: string,
): void => {
  const evaluationDir = path.join(workspacePath, 'evaluation')

  if (!fs.existsSync(evaluationDir)) {
    fs.mkdirSync(evaluationDir, { recursive: true })
  }

  saveIndividualResults(results, evaluationDir)

  if (results.length > 1) {
    saveSummaryResult(results, evaluationDir)
  }
}

const validateDirectories = (config: EvaluationConfig): void => {
  const outputDir = path.join(config.workspacePath, 'execution', 'output')
  const referenceDir = path.join(config.workspacePath, 'execution', 'reference')

  if (!fs.existsSync(outputDir)) {
    throw new Error(`Output directory does not exist: ${outputDir}`)
  }

  if (!fs.existsSync(referenceDir)) {
    throw new Error(`Reference directory does not exist: ${referenceDir}`)
  }
}

const prepareCasesForSpecificCase = (
  config: EvaluationConfig,
  outputData: Map<string, Schema>,
  referenceData: Map<string, Schema>,
): CaseData[] => {
  const caseId = config.caseId
  if (!caseId) {
    throw new Error('Case ID is required for specific case evaluation')
  }

  const outputSchema = outputData.get(caseId)
  const referenceSchema = referenceData.get(caseId)

  if (!outputSchema) {
    throw new Error(`Output schema not found for case: ${caseId}`)
  }
  if (!referenceSchema) {
    throw new Error(`Reference schema not found for case: ${caseId}`)
  }

  return [
    {
      caseId,
      outputSchema,
      referenceSchema,
    },
  ]
}

const prepareCasesForAllCases = (
  outputData: Map<string, Schema>,
  referenceData: Map<string, Schema>,
): CaseData[] => {
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

  return casesToEvaluate
}

const prepareCasesToEvaluate = (
  config: EvaluationConfig,
  outputData: Map<string, Schema>,
  referenceData: Map<string, Schema>,
): CaseData[] => {
  if (config.caseId) {
    return prepareCasesForSpecificCase(config, outputData, referenceData)
  }
  return prepareCasesForAllCases(outputData, referenceData)
}

export const evaluateSchema = async (
  config: EvaluationConfig,
): Promise<void> => {
  validateDirectories(config)

  const outputData = loadOutputData(config.workspacePath)
  const referenceData = loadReferenceData(config.workspacePath)

  const casesToEvaluate = prepareCasesToEvaluate(
    config,
    outputData,
    referenceData,
  )

  if (casesToEvaluate.length === 0) {
    throw new Error(
      'No cases to evaluate. Make sure output and reference schemas exist.',
    )
  }

  const results = await Promise.all(
    casesToEvaluate.map((caseData) => runEvaluation(caseData)),
  )

  saveResults(results, config.workspacePath)
}
