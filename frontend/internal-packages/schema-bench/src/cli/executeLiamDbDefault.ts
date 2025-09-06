#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { processDataset } from './executeLiamDbShared'
import {
  getWorkspacePath,
  handleCliError,
  handleUnexpectedError,
} from './utils'

async function main() {
  const datasetName = 'default'
  const datasetPath = join(getWorkspacePath(), datasetName)

  if (!existsSync(datasetPath)) {
    handleCliError(`Dataset "${datasetName}" not found at ${datasetPath}`)
    return
  }

  const result = await processDataset(datasetName, datasetPath)
  // Treat zero processed cases as failure to surface issues (e.g., empty inputs)
  if (result.success === 0 && result.failure === 0) {
    handleCliError(`No cases were processed for dataset "${datasetName}"`)
    return
  }
  if (result.failure > 0) {
    handleCliError(
      `${result.failure} case(s) failed in dataset "${datasetName}"`,
    )
    return
  }
}

main().catch(handleUnexpectedError)
