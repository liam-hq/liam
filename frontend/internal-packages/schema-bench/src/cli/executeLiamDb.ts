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
import {
  getWorkspaceSubPath,
  handleCliError,
  handleUnexpectedError,
} from './utils/index.ts'

const InputSchema = v.object({
  input: v.string(),
})

type LiamDBExecutorInput = v.InferOutput<typeof InputSchema>

async function loadInputFiles(): Promise<
  Result<Array<{ caseId: string; input: LiamDBExecutorInput }>, Error>
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
  const inputs: Array<{ caseId: string; input: LiamDBExecutorInput }> = []

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
  caseId: string,
  _input: LiamDBExecutorInput,
): Promise<Result<void, Error>> {
  // For now, return a placeholder result
  const placeholderOutput = {
    tables: {},
    message: 'LiamDB executor not implemented yet',
    timestamp: new Date().toISOString(),
  }

  const saveResult = await saveOutputFile(caseId, placeholderOutput)
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
  let successCount = 0
  let failureCount = 0

  for (const { caseId, input } of inputs) {
    const result = await executeCase(caseId, input)

    if (result.isOk()) {
      successCount++
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
