#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { evaluateSchema } from '../workspace/evaluation/evaluation.ts'
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

  const result = await evaluateSchema(config)

  if (result.isErr()) {
    console.error(
      `   ❌ Failed to evaluate dataset: ${JSON.stringify(result.error, null, 2)}`,
    )
    return { datasetName, success: false, results: null, error: result.error }
  }

  // Note: Aggregate/printing of dataset-level metrics can be added here when needed

  return { datasetName, success: true, results: result.value, error: null }
}

async function main() {
  const workspacePath = getWorkspacePath()

  // Parse command-line arguments
  const args = process.argv.slice(2)
  const requestedDatasets =
    args.length > 0 ? args : ['default', 'entity-extraction']

  // Define all available datasets
  const allDatasets = [
    { name: 'default', path: join(workspacePath, 'default') },
    {
      name: 'entity-extraction',
      path: join(workspacePath, 'entity-extraction'),
    },
  ]

  // Filter to requested datasets
  const datasets = allDatasets.filter((d) => requestedDatasets.includes(d.name))

  if (datasets.length === 0) {
    handleCliError(
      'No valid datasets specified. Available: default, entity-extraction',
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
