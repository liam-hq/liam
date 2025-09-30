#!/usr/bin/env node

import { resolve } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { err, ok, type Result } from 'neverthrow'
import * as v from 'valibot'
import { OpenAIExecutor } from '../executors/openai/openaiExecutor'
import type { OpenAIExecutorInput } from '../executors/openai/types'
import {
  filterAndResolveDatasets,
  getWorkspacePath,
  handleCliError,
  handleUnexpectedError,
  loadInputFiles,
  parseArgs,
  saveOutputFile,
  selectTargetDatasets,
} from './utils'

type DatasetResult = { datasetName: string; success: number; failure: number }

// Outputs: write latest and optional archive ID for correlation
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-')

const InputSchema = v.object({
  input: v.string(),
})

async function executeCase(
  executor: OpenAIExecutor,
  datasetName: string,
  datasetPath: string,
  caseId: string,
  input: OpenAIExecutorInput,
): Promise<Result<void, Error>> {
  const threadId = [datasetName, caseId, RUN_ID].join(':')
  /*
   * Retain this server-only log to deterministically correlate runs with LangSmith (thread_id/runId), surface an optional trace search URL, and aid troubleshooting with no secrets/PII and minimal overhead even if tracing is delayed or unavailable.
   */
  // biome-ignore lint/suspicious/noConsole: Allow server-side console output for LangSmith trace correlation
  console.log(
    `[schema-bench] executing case: dataset=${datasetName} case=${caseId} thread_id=${threadId}`,
  )
  const orgId = process.env['LANGSMITH_ORGANIZATION_ID']
  const projectId = process.env['LANGSMITH_PROJECT_ID']
  if (orgId && projectId) {
    const baseUrl = `https://smith.langchain.com/o/${orgId}/projects/p/${projectId}`
    const filter = `and(eq(is_root, true), and(eq(metadata_key, "thread_id"), eq(metadata_value, "${threadId}")))`
    const searchModel = encodeURIComponent(JSON.stringify({ filter }))
    // biome-ignore lint/suspicious/noConsole: Allow server-side console output for LangSmith trace correlation
    console.log(
      `[schema-bench] trace search URL: ${baseUrl}?searchModel=${searchModel}`,
    )
  }
  const result = await executor.execute(input, {
    traceContext: { datasetName, caseId, runId: RUN_ID, threadId },
  })
  if (result.isErr()) {
    return err(
      new Error(`Failed to execute ${caseId}: ${result.error.message}`),
    )
  }

  const saveResult = await saveOutputFile(datasetPath, caseId, result.value)
  if (saveResult.isErr()) {
    return saveResult
  }
  return ok(undefined)
}

async function processDataset(
  executor: OpenAIExecutor,
  datasetName: string,
  datasetPath: string,
): Promise<DatasetResult> {
  const inputsResult = await loadInputFiles<
    typeof InputSchema,
    OpenAIExecutorInput
  >(datasetPath, InputSchema, (value) => ({ input: value.input }))
  if (inputsResult.isErr()) {
    console.warn(`⚠️  ${datasetName}: ${inputsResult.error.message}`)
    return { datasetName, success: 0, failure: 1 }
  }

  const inputs = inputsResult.value
  if (inputs.length === 0) {
    console.warn('   ⚠️  No input files found')
    return { datasetName, success: 0, failure: 0 }
  }

  const MAX_CONCURRENT = 5
  let successCount = 0
  let failureCount = 0

  const processBatch = async (
    batch: Array<{ caseId: string; input: OpenAIExecutorInput }>,
  ) => {
    const promises = batch.map(({ caseId, input }) =>
      executeCase(executor, datasetName, datasetPath, caseId, input),
    )
    const results = await Promise.allSettled(promises)
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.isOk()) {
        successCount++
      } else {
        failureCount++
      }
    })
  }

  for (let i = 0; i < inputs.length; i += MAX_CONCURRENT) {
    const batch = inputs.slice(i, i + MAX_CONCURRENT)
    await processBatch(batch)
  }

  return { datasetName, success: successCount, failure: failureCount }
}

async function main() {
  // Load env from repo root for convenience (align with LiamDB executor)
  loadEnv({ path: resolve(__dirname, '../../../../../.env') })
  // Check API key
  const apiKey =
    process.env['OPENAI_API_KEY'] ??
    handleCliError('OPENAI_API_KEY environment variable is required')

  const options = parseArgs(process.argv)
  const workspacePath = getWorkspacePath()
  const targetDatasets = selectTargetDatasets(options, workspacePath)
  if (targetDatasets.length === 0) {
    handleCliError('No datasets found to process')
  }
  const validDatasets = filterAndResolveDatasets(targetDatasets, workspacePath)

  const executor = new OpenAIExecutor({ apiKey })

  const results: DatasetResult[] = []
  for (const { name, path } of validDatasets) {
    const r = await processDataset(executor, name, path)
    results.push(r)
  }

  if (results.length === 0) {
    handleCliError('No datasets were processed (all were missing or invalid).')
  }

  const totalFailure = results.reduce((sum, r) => sum + r.failure, 0)
  if (totalFailure > 0) {
    handleCliError(`${totalFailure} case(s) failed across selected datasets`)
  }
}

main().catch(handleUnexpectedError)
