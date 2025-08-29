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
    return { datasetName, success: false, results: null }
  }

  return { datasetName, success: true, results: result.value }
}

async function main() {
  const workspacePath = getWorkspacePath()

  // Define datasets to evaluate
  const datasets = [
    { name: 'default', path: join(workspacePath, 'default') },
    {
      name: 'entity-extraction',
      path: join(workspacePath, 'entity-extraction'),
    },
  ]

  const evaluationResults = []
  for (const dataset of datasets) {
    if (existsSync(dataset.path)) {
      const result = await evaluateDataset(dataset.name, dataset.path)
      evaluationResults.push(result)
    }
  }

  let allSuccess = true
  for (const result of evaluationResults) {
    if (!result.success) {
      allSuccess = false
    }
  }

  if (!allSuccess) {
    handleCliError('Some evaluations failed')
  }
}

main().catch(handleUnexpectedError)
