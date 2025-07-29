#!/usr/bin/env node

import { existsSync, mkdirSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path, { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import {
  err,
  fromPromise,
  ok,
  type Result,
  Result as ResultClass,
} from 'neverthrow'
import * as v from 'valibot'
import {
  LiamDbExecutorImpl,
  type LiamDbExecutorInput,
} from '../executors/liamDb/index.ts'
import {
  getWorkspaceSubPath,
  handleCliError,
  handleUnexpectedError,
} from './utils/index.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

config({ path: resolve(__dirname, '../../../../../.env') })

const InputSchema = v.object({
  input: v.string(),
})

async function loadInputFiles(): Promise<
  Result<Array<{ caseId: string; input: LiamDbExecutorInput }>, Error>
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
      input: {
        input: validationResult.output.input,
      },
    })
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
  caseId: string,
  input: LiamDbExecutorInput,
): Promise<Result<void, Error>> {
  const executor = new LiamDbExecutorImpl()

  const executionResult = await executor.execute(input)
  if (executionResult.isErr()) {
    return err(new Error(`Execution failed: ${executionResult.error.message}`))
  }

  const output = executionResult.value
  const saveResult = await saveOutputFile(caseId, output)
  if (saveResult.isErr()) {
    return saveResult
  }

  return ok(undefined)
}

async function main() {
  // Load input files
  const inputsResult = await loadInputFiles()
  if (inputsResult.isErr()) {
    handleCliError('Failed to load input files', inputsResult.error)
    return
  }

  const inputs = inputsResult.value

  if (inputs.length === 0) {
    return
  }

  // Process each case
  let _successCount = 0
  let failureCount = 0

  for (const { caseId, input } of inputs) {
    const result = await executeCase(caseId, input)

    if (result.isOk()) {
      _successCount++
    } else {
      failureCount++
      console.error(`❌ ${caseId} failed: ${result.error.message}`)
    }
  }

  if (failureCount > 0) {
    handleCliError(`${failureCount} case(s) failed`)
    return
  }
}

main().catch(handleUnexpectedError)
