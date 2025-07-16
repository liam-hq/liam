#!/usr/bin/env node

import { existsSync, mkdirSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as dotenv from 'dotenv'
import { err, ok, type Result } from 'neverthrow'
import * as v from 'valibot'
import { createLiamDBExecutorOffline } from '../executors/liamDb/liamDbExecutorOffline.ts'
import type { LiamDBExecutorInput } from '../executors/liamDb/types.ts'

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' })
}

dotenv.config({ path: '.env' })

const InputSchema = v.object({
  input: v.string(),
})

// Get the repo root directory (where pnpm command is executed from)
const REPO_ROOT = process.env['INIT_CWD'] || process.cwd()
const WORKSPACE_PATH = join(REPO_ROOT, 'benchmark-workspace')

async function loadInputFiles(): Promise<
  Result<Array<{ caseId: string; input: LiamDBExecutorInput }>, Error>
> {
  const inputDir = join(WORKSPACE_PATH, 'execution/input')

  if (!existsSync(inputDir)) {
    return err(
      new Error(
        `Input directory not found: ${inputDir}. Please run setup-workspace first.`,
      ),
    )
  }

  try {
    const files = await readdir(inputDir)
    const jsonFiles = files.filter((file) => file.endsWith('.json'))

    const inputs: Array<{ caseId: string; input: LiamDBExecutorInput }> = []

    for (const file of jsonFiles) {
      const caseId = file.replace('.json', '')
      const content = await readFile(join(inputDir, file), 'utf-8')
      const data = JSON.parse(content)

      const result = v.safeParse(InputSchema, data)
      if (!result.success) {
        return err(
          new Error(
            `Invalid input format in ${file}: ${JSON.stringify(result.issues)}`,
          ),
        )
      }

      inputs.push({ caseId, input: result.output })
    }

    return ok(inputs)
  } catch (error) {
    if (error instanceof Error) {
      return err(error)
    }
    return err(new Error('Failed to load input files'))
  }
}

async function saveOutputFile(
  caseId: string,
  output: unknown,
): Promise<Result<void, Error>> {
  const outputDir = join(WORKSPACE_PATH, 'execution/output')

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  try {
    const outputPath = join(outputDir, `${caseId}.json`)
    await writeFile(outputPath, JSON.stringify(output, null, 2))
    return ok(undefined)
  } catch (error) {
    if (error instanceof Error) {
      return err(error)
    }
    return err(new Error(`Failed to save output for ${caseId}`))
  }
}

async function executeCase(
  executor: ReturnType<typeof createLiamDBExecutorOffline>,
  caseId: string,
  input: LiamDBExecutorInput,
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
  // Load input files
  const inputsResult = await loadInputFiles()
  if (inputsResult.isErr()) {
    console.error(`❌ Error: ${inputsResult.error.message}`)
    process.exit(1)
  }

  const inputs = inputsResult.value
  console.log(`Found ${inputs.length} input files:`, inputs.map(i => i.caseId))

  if (inputs.length === 0) {
    return
  }

  // Create offline executor
  const executor = createLiamDBExecutorOffline()

  // Process each case
  let successCount = 0
  let failureCount = 0

  for (const { caseId, input } of inputs) {
    console.log(`\n📝 Processing ${caseId}...`)
    const result = await executeCase(executor, caseId, input)
    if (result.isOk()) {
      successCount++
      console.log(`✅ ${caseId} completed successfully`)
    } else {
      failureCount++
      console.error(`❌ ${caseId} failed: ${result.error.message}`)
    }
  }

  if (failureCount > 0) {
    process.exit(1)
  }
}

// Set a global timeout of 40 minutes
const GLOBAL_TIMEOUT_MS = 40 * 60 * 1000 // 40 minutes

const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => {
    reject(new Error('Script execution timed out after 40 minutes'))
  }, GLOBAL_TIMEOUT_MS)
})

Promise.race([main(), timeoutPromise]).catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
