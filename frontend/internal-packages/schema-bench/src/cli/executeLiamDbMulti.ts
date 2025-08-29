#!/usr/bin/env node

import { existsSync, mkdirSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { config } from 'dotenv'
import {
  err,
  fromPromise,
  ok,
  type Result,
  Result as ResultClass,
} from 'neverthrow'
import * as v from 'valibot'
import { execute, type LiamDbExecutorInput } from '../executors/liamDb/index.ts'
import {
  getWorkspacePath,
  handleCliError,
  handleUnexpectedError,
} from './utils/index.ts'

config({ path: resolve(__dirname, '../../../../../.env') })

const InputSchema = v.object({
  input: v.string(),
})

async function loadInputFiles(
  datasetPath: string,
): Promise<
  Result<Array<{ caseId: string; input: LiamDbExecutorInput }>, Error>
> {
  const inputDir = join(datasetPath, 'execution/input')

  if (!existsSync(inputDir)) {
    return err(
      new Error(
        `Input directory not found: ${inputDir}. Please run setup-workspace first.`,
      ),
    )
  }

  const filesResult = await fromPromise(readdir(inputDir), (error) =>
    error instanceof Error ? error : new Error('Failed to read directory'),
  )

  if (filesResult.isErr()) {
    return err(filesResult.error)
  }

  const jsonFiles = filesResult.value.filter((file) => file.endsWith('.json'))
  const inputs: Array<{ caseId: string; input: LiamDbExecutorInput }> = []

  for (const file of jsonFiles) {
    const caseId = file.replace('.json', '')
    const contentResult = await fromPromise(
      readFile(join(inputDir, file), 'utf-8'),
      (error) =>
        error instanceof Error
          ? error
          : new Error(`Failed to read file ${file}`),
    )

    if (contentResult.isErr()) {
      return err(contentResult.error)
    }

    const parseResult = ResultClass.fromThrowable(
      () => JSON.parse(contentResult.value),
      (error) =>
        error instanceof Error
          ? error
          : new Error(`Failed to parse JSON in ${file}`),
    )()

    if (parseResult.isErr()) {
      return err(parseResult.error)
    }

    const validationResult = v.safeParse(InputSchema, parseResult.value)
    if (!validationResult.success) {
      return err(
        new Error(
          `Invalid input format in ${file}: ${JSON.stringify(validationResult.issues)}`,
        ),
      )
    }

    inputs.push({
      caseId,
      input: validationResult.output satisfies LiamDbExecutorInput,
    })
  }

  return ok(inputs)
}

async function saveOutputFile(
  datasetPath: string,
  caseId: string,
  output: unknown,
): Promise<Result<void, Error>> {
  const outputDir = join(datasetPath, 'execution/output')

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  const outputPath = join(outputDir, `${caseId}.json`)
  const writeResult = await fromPromise(
    writeFile(outputPath, JSON.stringify(output, null, 2)),
    (error) =>
      error instanceof Error
        ? error
        : new Error(`Failed to save output for ${caseId}`),
  )

  return writeResult.map(() => undefined)
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

  const saveResult = await saveOutputFile(datasetPath, caseId, result.value)
  if (saveResult.isErr()) {
    return saveResult
  }
  return ok(undefined)
}

async function processDataset(datasetName: string, datasetPath: string) {
  // Load input files
  const inputsResult = await loadInputFiles(datasetPath)
  if (inputsResult.isErr()) {
    return { datasetName, success: 0, failure: 0 }
  }

  const inputs = inputsResult.value

  if (inputs.length === 0) {
    return { datasetName, success: 0, failure: 0 }
  }

  // Process each case with max 4 concurrent request
  const MAX_CONCURRENT = 4
  let successCount = 0
  let failureCount = 0

  const processBatch = async (
    batch: Array<{ caseId: string; input: LiamDbExecutorInput }>,
  ) => {
    const promises = batch.map(({ caseId, input }) =>
      executeCase(datasetPath, caseId, input),
    )
    const results = await Promise.allSettled(promises)

    results.forEach((result, index) => {
      const batchItem = batch[index]
      if (!batchItem) return

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
  const workspacePath = getWorkspacePath()

  // Define datasets to process
  const datasets = [
    { name: 'default', path: join(workspacePath, 'default') },
    {
      name: 'entity-extraction',
      path: join(workspacePath, 'entity-extraction'),
    },
  ]

  const results = []
  for (const dataset of datasets) {
    if (existsSync(dataset.path)) {
      const result = await processDataset(dataset.name, dataset.path)
      results.push(result)
    }
  }
  let totalSuccess = 0
  let totalFailure = 0

  for (const result of results) {
    totalSuccess += result.success
    totalFailure += result.failure
  }

  if (totalFailure > 0) {
    handleCliError(`${totalFailure} case(s) failed across all datasets`)
    return
  }
}

main().catch(handleUnexpectedError)
