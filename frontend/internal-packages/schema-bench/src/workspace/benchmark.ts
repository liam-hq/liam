import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Schema } from '@liam-hq/db-structure'
import { evaluate } from '../evaluate/evaluate.ts'
import type {
  BenchmarkConfig,
  BenchmarkResult,
  CaseData,
  FileSystemAdapter,
} from './types'

export class BenchmarkRunner {
  fs: FileSystemAdapter

  constructor(fs: FileSystemAdapter) {
    this.fs = fs
  }

  private loadOutputData(workspacePath: string): Map<string, Schema> {
    const outputDir = path.join(workspacePath, 'execution', 'output')
    const outputData = new Map<string, Schema>()

    if (!this.fs.existsSync(outputDir)) {
      throw new Error(`Output directory does not exist: ${outputDir}`)
    }

    const files = this.fs
      .readdirSync(outputDir)
      .filter((file) => file.endsWith('.json'))

    for (const file of files) {
      const caseId = path.basename(file, '.json')
      const filePath = path.join(outputDir, file)

      try {
        const content = this.fs.readFileSync(filePath, 'utf-8')
        const schema = JSON.parse(content) as Schema
        outputData.set(caseId, schema)
      } catch (error) {
        console.error(`❌ Failed to load output file ${file}:`, error)
        throw error
      }
    }

    return outputData
  }

  private loadReferenceData(workspacePath: string): Map<string, Schema> {
    const referenceDir = path.join(workspacePath, 'execution', 'reference')
    const referenceData = new Map<string, Schema>()

    if (!this.fs.existsSync(referenceDir)) {
      throw new Error(`Reference directory does not exist: ${referenceDir}`)
    }

    const files = this.fs
      .readdirSync(referenceDir)
      .filter((file) => file.endsWith('.json'))

    for (const file of files) {
      const caseId = path.basename(file, '.json')
      const filePath = path.join(referenceDir, file)

      try {
        const content = this.fs.readFileSync(filePath, 'utf-8')
        const schema = JSON.parse(content) as Schema
        referenceData.set(caseId, schema)
      } catch (error) {
        console.error(`❌ Failed to load reference file ${file}:`, error)
        throw error
      }
    }

    return referenceData
  }

  private async runEvaluation(caseData: CaseData): Promise<BenchmarkResult> {
    const result = await evaluate(
      caseData.referenceSchema,
      caseData.outputSchema,
    )

    const benchmarkResult: BenchmarkResult = {
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

    return benchmarkResult
  }

  private saveResults(results: BenchmarkResult[], workspacePath: string): void {
    const evaluationDir = path.join(workspacePath, 'evaluation')

    if (!this.fs.existsSync(evaluationDir)) {
      this.fs.mkdirSync(evaluationDir, { recursive: true })
    }

    for (const result of results) {
      const filename = `${result.caseId}_results_${result.timestamp.replace(/[:.]/g, '-')}.json`
      const filePath = path.join(evaluationDir, filename)

      this.fs.writeFileSync(filePath, JSON.stringify(result, null, 2))
    }

    if (results.length > 1) {
      const summaryResult = {
        timestamp: new Date().toISOString(),
        totalCases: results.length,
        averageMetrics: {
          tableF1Score:
            results.reduce((sum, r) => sum + r.metrics.tableF1Score, 0) /
            results.length,
          tableAllCorrectRate:
            results.reduce((sum, r) => sum + r.metrics.tableAllCorrectRate, 0) /
            results.length,
          columnF1ScoreAverage:
            results.reduce(
              (sum, r) => sum + r.metrics.columnF1ScoreAverage,
              0,
            ) / results.length,
          columnAllCorrectRateAverage:
            results.reduce(
              (sum, r) => sum + r.metrics.columnAllCorrectRateAverage,
              0,
            ) / results.length,
          primaryKeyAccuracyAverage:
            results.reduce(
              (sum, r) => sum + r.metrics.primaryKeyAccuracyAverage,
              0,
            ) / results.length,
          constraintAccuracy:
            results.reduce((sum, r) => sum + r.metrics.constraintAccuracy, 0) /
            results.length,
          foreignKeyF1Score:
            results.reduce((sum, r) => sum + r.metrics.foreignKeyF1Score, 0) /
            results.length,
          foreignKeyAllCorrectRate:
            results.reduce(
              (sum, r) => sum + r.metrics.foreignKeyAllCorrectRate,
              0,
            ) / results.length,
          overallSchemaAccuracy:
            results.reduce(
              (sum, r) => sum + r.metrics.overallSchemaAccuracy,
              0,
            ) / results.length,
        },
        cases: results.map((r) => ({
          caseId: r.caseId,
          overallSchemaAccuracy: r.metrics.overallSchemaAccuracy,
        })),
      }

      const summaryFilename = `summary_results_${summaryResult.timestamp.replace(/[:.]/g, '-')}.json`
      const summaryFilePath = path.join(evaluationDir, summaryFilename)

      this.fs.writeFileSync(
        summaryFilePath,
        JSON.stringify(summaryResult, null, 2),
      )
    }
  }

  private displaySummary(results: BenchmarkResult[]): void {
    if (results.length === 0) {
      return
    }
    for (const result of results) {
      // Display individual results if needed
    }

    if (results.length > 1) {
      const avgOverall =
        results.reduce((sum, r) => sum + r.metrics.overallSchemaAccuracy, 0) /
        results.length
      const avgTableF1 =
        results.reduce((sum, r) => sum + r.metrics.tableF1Score, 0) /
        results.length
      const avgColumnF1 =
        results.reduce((sum, r) => sum + r.metrics.columnF1ScoreAverage, 0) /
        results.length
      // Display summary if needed
    }
  }

  async runBenchmark(config: BenchmarkConfig): Promise<void> {
    // Check directories exist first
    const outputDir = path.join(config.workspacePath, 'execution', 'output')
    const referenceDir = path.join(
      config.workspacePath,
      'execution',
      'reference',
    )

    if (!this.fs.existsSync(outputDir)) {
      throw new Error(`Output directory does not exist: ${outputDir}`)
    }

    if (!this.fs.existsSync(referenceDir)) {
      throw new Error(`Reference directory does not exist: ${referenceDir}`)
    }

    const outputData = this.loadOutputData(config.workspacePath)
    const referenceData = this.loadReferenceData(config.workspacePath)

    const casesToEvaluate: CaseData[] = []

    if (config.caseId) {
      const outputSchema = outputData.get(config.caseId)
      const referenceSchema = referenceData.get(config.caseId)

      if (!outputSchema) {
        throw new Error(`Output schema not found for case: ${config.caseId}`)
      }
      if (!referenceSchema) {
        throw new Error(`Reference schema not found for case: ${config.caseId}`)
      }

      casesToEvaluate.push({
        caseId: config.caseId,
        outputSchema,
        referenceSchema,
      })
    } else {
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
    }

    if (casesToEvaluate.length === 0) {
      throw new Error(
        'No cases to evaluate. Make sure output and reference schemas exist.',
      )
    }

    const results = await Promise.all(
      casesToEvaluate.map((caseData) => this.runEvaluation(caseData)),
    )

    this.saveResults(results, config.workspacePath)
    this.displaySummary(results)
  }
}

// Node.js fs adapter for production use
const createNodeFsAdapter = (): FileSystemAdapter => ({
  existsSync: fs.existsSync,
  mkdirSync: fs.mkdirSync,
  rmSync: fs.rmSync,
  readdirSync: fs.readdirSync,
  copyFileSync: fs.copyFileSync,
  readFileSync: fs.readFileSync,
  writeFileSync: fs.writeFileSync,
})

export const runBenchmark = async (config: BenchmarkConfig): Promise<void> => {
  const benchmarkRunner = new BenchmarkRunner(createNodeFsAdapter())
  return benchmarkRunner.runBenchmark(config)
}

const main = async (): Promise<void> => {
  const initCwd = process.env.INIT_CWD || process.cwd()
  const workspacePath = path.resolve(initCwd, 'benchmark-workspace')
  const args = process.argv.slice(2)

  let caseId: string | undefined
  const caseArg = args.find((arg) => arg.startsWith('--case='))
  if (caseArg) {
    caseId = caseArg.split('=')[1]
  }

  const casesArg = args.find((arg) => arg.startsWith('--cases='))
  if (casesArg && !caseId) {
    const cases = casesArg.split('=')[1].split(',')
    if (cases.length === 1) {
      caseId = cases[0]
    }
  }

  const config: BenchmarkConfig = {
    workspacePath,
    caseId,
    outputFormat: 'json',
  }

  try {
    await runBenchmark(config)
  } catch (error) {
    console.error('❌ Benchmark evaluation failed:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
