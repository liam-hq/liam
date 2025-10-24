#!/usr/bin/env node

import { resolve } from 'node:path'
import { fromPromise } from '@liam-hq/neverthrow'
import { config } from 'dotenv'
import { evaluate } from 'langsmith/evaluation'
import { ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import { execute as executeLiamDb } from '../executors/liamDb/liamDbExecutor.ts'
import { OpenAIExecutor } from '../executors/openai/openaiExecutor.ts'
import { schemaEvaluator } from '../langsmith/schemaEvaluator.ts'
import type { LangSmithInput, LangSmithOutput } from '../langsmith/types.ts'
import {
  filterAndResolveDatasets,
  getWorkspacePath,
  handleCliError,
  handleUnexpectedError,
  parseArgs,
  selectTargetDatasets,
} from './utils/index.ts'

config({ path: resolve(__dirname, '../../../../../.env') })

const executorTypeSchema = v.picklist(['liamdb', 'openai'])
const positiveIntegerSchema = v.pipe(
  v.union([v.pipe(v.string(), v.transform(Number)), v.number()]),
  v.integer(),
  v.minValue(1),
)
const optionsSchema = v.object({
  executorType: v.optional(executorTypeSchema, 'liamdb'),
  numRepetitions: v.optional(positiveIntegerSchema, 3),
  maxConcurrency: v.optional(positiveIntegerSchema, 3),
})

type ExecutorOptions = v.InferOutput<typeof optionsSchema>
type ExecutorType = v.InferOutput<typeof executorTypeSchema>

const parseExecutorAndOptions = (argv: string[]): ExecutorOptions => {
  const args = argv.slice(2)

  const rawOptions: Record<string, unknown> = {}

  for (const arg of args) {
    if (arg === '--openai') {
      rawOptions['executorType'] = 'openai'
    } else if (arg === '--liamdb') {
      rawOptions['executorType'] = 'liamdb'
    } else if (arg.startsWith('--num-repetitions=')) {
      rawOptions['numRepetitions'] = arg.split('=')[1]
    } else if (arg.startsWith('--max-concurrency=')) {
      rawOptions['maxConcurrency'] = arg.split('=')[1]
    }
  }

  return v.parse(optionsSchema, rawOptions)
}

const createTarget = (
  executorType: ExecutorType,
): ((input: LangSmithInput) => Promise<LangSmithOutput>) => {
  if (executorType === 'liamdb') {
    return async (input: LangSmithInput): Promise<LangSmithOutput> => {
      const prompt = input.prompt || input.input || ''

      const result = await executeLiamDb({ input: prompt })

      if (result.isErr()) {
        throw result.error
      }

      return { schema: result.value }
    }
  }

  if (executorType === 'openai') {
    const apiKey =
      process.env['OPENAI_API_KEY'] ??
      handleCliError('OPENAI_API_KEY environment variable is required')

    const executor = new OpenAIExecutor({ apiKey })

    return async (input: LangSmithInput): Promise<LangSmithOutput> => {
      const prompt = input.prompt || input.input || ''

      const result = await executor.execute({ input: prompt })

      if (result.isErr()) {
        throw result.error
      }

      return { schema: result.value }
    }
  }

  return handleCliError(`Unknown executor type: ${executorType}`)
}

type ExperimentResults = Awaited<ReturnType<typeof evaluate>>

const runEvaluation = (
  datasetName: string,
  options: ExecutorOptions,
): ResultAsync<ExperimentResults, Error> => {
  const target = createTarget(options.executorType)

  return fromPromise(
    evaluate(target, {
      data: `schema-bench-${datasetName}`,
      evaluators: [schemaEvaluator],
      experimentPrefix: `${options.executorType}-${datasetName}`,
      maxConcurrency: options.maxConcurrency,
      numRepetitions: options.numRepetitions,
    }),
  )
}

const runDatasets = async (
  datasets: Array<{ name: string }>,
  options: ExecutorOptions,
) => {
  const results = datasets.map(({ name }) => runEvaluation(name, options))
  return ResultAsync.combineWithAllErrors(results)
}

const main = async () => {
  // Filter out executor options (--xxx) for parseArgs
  const datasetArgs = process.argv.filter((arg) => !arg.startsWith('--'))

  // Parse dataset flags using existing utility
  const cliOptions = parseArgs(datasetArgs)

  // Parse executor and evaluation options
  const options = parseExecutorAndOptions(process.argv)

  // Get workspace and select datasets
  const workspacePath = getWorkspacePath()
  const targetDatasets = selectTargetDatasets(cliOptions, workspacePath)

  if (targetDatasets.length === 0) {
    handleCliError('No datasets found to process. Use -all or -<dataset-name>')
  }

  const validDatasets = filterAndResolveDatasets(targetDatasets, workspacePath)

  if (validDatasets.length === 0) {
    handleCliError('No valid datasets found in workspace')
  }

  const result = await runDatasets(validDatasets, options)

  if (result.isErr()) {
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(handleUnexpectedError)
}
