#!/usr/bin/env node

import { join, resolve } from 'node:path'
import { err, ok, type Result } from '@liam-hq/neverthrow'
import { config } from 'dotenv'
import * as v from 'valibot'
import { execute, type LiamDbExecutorInput } from '../executors/liamDb/index.ts'
import { loadJsonFiles, saveOutputFile } from './utils'

config({ path: resolve(__dirname, '../../../../../.env') })

// Outputs: write latest and archive by RUN_ID per execution (with executor label)
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-')

const InputSchema = v.union([
  v.object({
    input: v.string(),
  }),
  v.string(), // Support legacy format
])

type DatasetResult = {
  datasetName: string
  success: number
  failure: number
}

async function executeCase(
  datasetPath: string,
  caseId: string,
  input: LiamDbExecutorInput,
): Promise<Result<void, Error>> {
  const result = await execute(input)
  if (result.isErr()) {
    return err(
      new Error(`Failed to execute ${caseId}: ${result.error.message}`),
    )
  }

  const saveResult = await saveOutputFile(datasetPath, caseId, result.value, {
    archiveRunId: RUN_ID,
    executor: 'liamdb',
  })
  if (saveResult.isErr()) {
    return saveResult
  }
  return ok(undefined)
}

export async function processDataset(
  datasetName: string,
  datasetPath: string,
): Promise<DatasetResult> {
  // Load input files
  const inputsResult = await loadJsonFiles<
    typeof InputSchema,
    LiamDbExecutorInput
  >(join(datasetPath, 'execution', 'input'), InputSchema, (value) => ({
    input: typeof value === 'string' ? value : value.input,
  }))
  if (inputsResult.isErr()) {
    console.warn(`⚠️  ${datasetName}: ${inputsResult.error.message}`)
    return { datasetName, success: 0, failure: 1 }
  }

  const inputs = inputsResult.value

  if (inputs.length === 0) {
    console.warn('   ⚠️  No input files found')
    return { datasetName, success: 0, failure: 0 }
  }

  // Process each case with max 5 concurrent requests for stability
  const MAX_CONCURRENT = 5
  let successCount = 0
  let failureCount = 0

  const processBatch = async (
    batch: Array<{ caseId: string; data: LiamDbExecutorInput }>,
  ) => {
    const promises = batch.map(({ caseId, data }) =>
      executeCase(datasetPath, caseId, data),
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
