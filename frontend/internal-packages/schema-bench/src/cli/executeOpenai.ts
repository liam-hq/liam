#!/usr/bin/env node

import { existsSync, mkdirSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  err,
  fromPromise,
  ok,
  type Result,
  Result as ResultClass,
} from 'neverthrow'
import * as v from 'valibot'
import { OpenAIExecutor } from '../executors/openai/openaiExecutor.ts'
import type { OpenAIExecutorInput } from '../executors/openai/types.ts'
import {
  getWorkspaceSubPath,
  handleCliError,
  handleUnexpectedError,
} from './utils/index.ts'

const InputSchema = v.object({
  input: v.string(),
})

// Workspace path is now handled by common utilities

async function loadInputFiles(): Promise<
  Result<Array<{ caseId: string; input: OpenAIExecutorInput }>, Error>
> {
  const inputDir = getWorkspaceSubPath('execution/input')

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
  const inputs: Array<{ caseId: string; input: OpenAIExecutorInput }> = []

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

    inputs.push({ caseId, input: validationResult.output })
  }

  return ok(inputs)
}

async function saveOutputFile(
  caseId: string,
  output: unknown,
): Promise<Result<void, Error>> {
  const outputDir = getWorkspaceSubPath('execution/output')

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
  executor: OpenAIExecutor,
  caseId: string,
  input: OpenAIExecutorInput,
): Promise<Result<void, Error>> {
  const result = await executor.execute(input)
  if (result.isErr()) {
    return err(
      new Error(`Failed to execute ${caseId}: ${result.error.message}`),
    )
  }

  const saveResult = await saveOutputFile(caseId, result.value)
  if (saveResult.isErr()) {
    return saveResult
  }
  return ok(undefined)
}

async function main() {
  // Check API key
  const apiKey = process.env['OPENAI_API_KEY']
  if (!apiKey) {
    handleCliError('OPENAI_API_KEY environment variable is required')
    return // This will never be reached but helps TypeScript
  }

  // Load input files
  const inputsResult = await loadInputFiles()
  if (inputsResult.isErr()) {
    handleCliError('Failed to load input files', inputsResult.error)
    return // This will never be reached but helps TypeScript
  }

  const inputs = inputsResult.value

  if (inputs.length === 0) {
    // No input files found, exit silently
    return
  }

  // Create executor
  const executor = new OpenAIExecutor({ apiKey })

  // Process each case with max 4 concurrent requests
  const MAX_CONCURRENT = 4
  let successCount = 0
  let failureCount = 0

  const getErrorMessage = (
    result: PromiseSettledResult<Result<void, Error>>,
  ): string => {
    if (result.status === 'fulfilled' && result.value.isErr()) {
      return result.value.error.message
    }
    if (result.status === 'rejected' && result.reason instanceof Error) {
      return result.reason.message
    }
    return 'Unknown error'
  }

  const processBatch = async (
    batch: Array<{ caseId: string; input: OpenAIExecutorInput }>,
  ) => {
    const promises = batch.map(({ caseId, input }) =>
      executeCase(executor, caseId, input),
    )
    const results = await Promise.allSettled(promises)

    results.forEach((result, index) => {
      const batchItem = batch[index]
      if (!batchItem) return

      const { caseId } = batchItem
      if (result.status === 'fulfilled' && result.value.isOk()) {
        successCount++
      } else {
        failureCount++
        const error = getErrorMessage(result)
        console.error(`❌ ${caseId} failed: ${error}`)
      }
    })
  }

  for (let i = 0; i < inputs.length; i += MAX_CONCURRENT) {
    const batch = inputs.slice(i, i + MAX_CONCURRENT)
    await processBatch(batch)
  }

  if (failureCount > 0) {
    handleCliError(`${failureCount} case(s) failed`)
    return // This will never be reached but helps TypeScript
  }
}

main().catch(handleUnexpectedError)
