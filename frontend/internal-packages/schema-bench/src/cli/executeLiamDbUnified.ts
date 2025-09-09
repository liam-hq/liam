#!/usr/bin/env node

import { existsSync, readdirSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { processDataset } from './executeLiamDbShared'
import {
  getWorkspacePath,
  handleCliError,
  handleUnexpectedError,
} from './utils'

type CliOptions = {
  datasets?: string[]
  useAll?: boolean
}

// Allow alphanumerics, '-', '_', 1..64 chars
const VALID_DATASET = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/

const parseArgs = (argv: string[]): CliOptions => {
  // Supported patterns:
  // - executeLiamDB -all
  // - executeLiamDB -default -entity-extraction
  const options: CliOptions = {}
  const args = argv.slice(2)
  for (const tok of args) {
    if (!tok || !tok.startsWith('-')) continue
    const name = tok.replace(/^-+/, '')
    if (name === 'all') {
      options.useAll = true
      continue
    }
    if (name) {
      if (!VALID_DATASET.test(name)) {
        handleCliError(
          `Invalid dataset token "${name}". Allowed: letters, numbers, "-", "_" (1–64 chars).`,
        )
      }
      options.datasets = [...(options.datasets ?? []), name]
    }
  }
  return options
}

const discoverDefaultDatasets = (workspacePath: string): string[] => {
  // Default behavior: run only the 'default' dataset if it exists
  const name = 'default'
  return existsSync(join(workspacePath, name)) ? [name] : []
}

const listAllDatasets = (workspacePath: string): string[] => {
  try {
    const entries = readdirSync(workspacePath, { withFileTypes: true })
    return entries.filter((e) => e.isDirectory()).map((e) => e.name)
  } catch {
    return []
  }
}
// biome-ignore lint: temporary suppression for complexity; will refactor in a separate issue
async function main() {
  const options = parseArgs(process.argv)

  const workspacePath = getWorkspacePath()
  let targetDatasets: string[] = []
  if (options.useAll) {
    targetDatasets = listAllDatasets(workspacePath)
  } else if (!options.datasets || options.datasets.length === 0) {
    targetDatasets = discoverDefaultDatasets(workspacePath)
  }
  if (options.datasets && options.datasets.length > 0) {
    const union = new Set([...targetDatasets, ...options.datasets])
    targetDatasets = Array.from(union)
  }

  if (targetDatasets.length === 0) {
    handleCliError('No datasets found to process')
    return
  }

  const results: Array<{
    datasetName: string
    success: number
    failure: number
  }> = []

  // Resolve workspace path once for containment checks
  const resolvedWorkspace = resolve(workspacePath)

  for (const name of targetDatasets) {
    // Resolve and verify the path stays within the workspace
    const datasetPath = resolve(workspacePath, name)
    const rel = relative(resolvedWorkspace, datasetPath)
    if (rel.startsWith('..') || isAbsolute(rel)) {
      console.warn(`   ⚠️  Skipping invalid dataset path: ${name}`)
      continue
    }
    if (!existsSync(datasetPath)) {
      // Silently skip missing datasets to mirror existing behavior
      continue
    }
    const result = await processDataset(name, datasetPath)
    results.push(result)
  }

  // Fail fast if nothing was processed (all targets missing/invalid)
  if (results.length === 0) {
    handleCliError('No datasets were processed (all were missing or invalid).')
    return
  }

  const totalSuccess = results.reduce((sum, r) => sum + r.success, 0)
  const totalFailure = results.reduce((sum, r) => sum + r.failure, 0)

  // Treat all-zero aggregate as failure to surface empty/invalid datasets
  if (totalSuccess === 0 && totalFailure === 0) {
    handleCliError('No cases were processed across selected datasets')
    return
  }
  if (totalFailure > 0) {
    handleCliError(`${totalFailure} case(s) failed across selected datasets`)
    return
  }
}

main().catch(handleUnexpectedError)
