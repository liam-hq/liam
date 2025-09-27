#!/usr/bin/env node

import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  evaluateSchema,
  evaluateSchemaAtOutputDir,
} from '../workspace/evaluation/evaluation.ts'
import type { EvaluationConfig } from '../workspace/types'
import {
  getWorkspacePath,
  handleCliError,
  handleUnexpectedError,
} from './utils/index.ts'

async function evaluateDataset(datasetName: string, datasetPath: string) {
  const config: EvaluationConfig = {
    workspacePath: datasetPath,
    outputFormat: 'json',
  }

  // 1) Evaluate latest outputs
  const latestResult = await evaluateSchema(config)
  if (latestResult.isErr()) {
    console.error(
      `   ❌ Failed to evaluate latest outputs for ${datasetName}: ${JSON.stringify(latestResult.error, null, 2)}`,
    )
  }

  // 2) Evaluate archived runs under execution/output/runs/<RUN_DIR>
  const runsRoot = join(datasetPath, 'execution', 'output', 'runs')
  const runEvaluations: Array<{ runDir: string; ok: boolean }> = []
  if (existsSync(runsRoot)) {
    const runDirs = readdirSync(runsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)

    for (const runDirName of runDirs) {
      const outputDir = join(runsRoot, runDirName)
      const scopeSubdir = join('runs', runDirName)
      const runResult = await evaluateSchemaAtOutputDir(
        config,
        outputDir,
        scopeSubdir,
      )
      if (runResult.isErr()) {
        console.warn(
          `   ⚠️  Failed to evaluate run ${runDirName} for ${datasetName}: ${JSON.stringify(runResult.error, null, 2)}`,
        )
        runEvaluations.push({ runDir: runDirName, ok: false })
      } else {
        runEvaluations.push({ runDir: runDirName, ok: true })
      }
    }
  }

  const allOk = latestResult.isOk() && runEvaluations.every((r) => r.ok)
  const combined = latestResult.isOk() ? latestResult.value : []
  return { datasetName, success: allOk, results: combined, error: null }
}

async function main() {
  const workspacePath = getWorkspacePath()

  // Parse command-line arguments
  const args = process.argv.slice(2)
  const requestedDatasets =
    args.length > 0
      ? args
      : [
          'default',
          'entity-extraction',
          'ambiguous-recall',
          'relational-inference',
          'logical-deletion',
        ]

  // Define all available datasets
  const allDatasets = [
    { name: 'default', path: join(workspacePath, 'default') },
    {
      name: 'entity-extraction',
      path: join(workspacePath, 'entity-extraction'),
    },
    { name: 'ambiguous-recall', path: join(workspacePath, 'ambiguous-recall') },
    {
      name: 'relational-inference',
      path: join(workspacePath, 'relational-inference'),
    },
    { name: 'logical-deletion', path: join(workspacePath, 'logical-deletion') },
  ]

  // Filter to requested datasets
  const datasets = allDatasets.filter((d) => requestedDatasets.includes(d.name))

  if (datasets.length === 0) {
    handleCliError(
      'No valid datasets specified. Available: default, entity-extraction, ambiguous-recall, relational-inference, logical-deletion',
    )
    return
  }

  // Check which datasets exist
  const availableDatasets = datasets.filter((dataset) => {
    const exists = existsSync(dataset.path)
    if (!exists) {
      console.warn(`⚠️  Dataset "${dataset.name}" not found at ${dataset.path}`)
    }
    return exists
  })

  if (availableDatasets.length === 0) {
    handleCliError('No datasets found to evaluate')
    return
  }

  // Evaluate datasets
  const evaluationResults = []
  for (const dataset of availableDatasets) {
    const result = await evaluateDataset(dataset.name, dataset.path)
    evaluationResults.push(result)
  }

  // Collect statistics
  let allSuccess = true
  const failedDatasets = []

  for (const result of evaluationResults) {
    if (!result.success) {
      allSuccess = false
      failedDatasets.push(result.datasetName)
    }
  }

  if (failedDatasets.length > 0) {
  }

  if (!allSuccess) {
    handleCliError(`Evaluation failed for ${failedDatasets.length} dataset(s)`)
    return
  }
}

main().catch(handleUnexpectedError)
