#!/usr/bin/env node

import { join, resolve } from 'node:path'
import { fromPromise, ResultAsync } from '@liam-hq/neverthrow'
import { type Schema, schemaSchema } from '@liam-hq/schema'
import { config } from 'dotenv'
import { Client } from 'langsmith'
import * as v from 'valibot'
import type { LangSmithDatasetConfig } from '../langsmith/types.ts'
import {
  filterAndResolveDatasets,
  getWorkspacePath,
  handleCliError,
  handleUnexpectedError,
  loadJsonFiles,
  parseArgs,
  selectTargetDatasets,
} from './utils/index.ts'

config({ path: resolve(__dirname, '../../../../../.env') })

const inputSchema = v.union([v.string(), v.object({ input: v.string() })])

const getOrCreateDataset = (client: Client, datasetName: string) => {
  return fromPromise(client.readDataset({ datasetName })).orElse(() =>
    fromPromise(client.createDataset(datasetName)),
  )
}

const findExistingExample = async (
  client: Client,
  datasetId: string,
  caseId: string,
) => {
  for await (const example of client.listExamples({ datasetId })) {
    const metadata = example.metadata
    if (metadata && 'caseId' in metadata && metadata['caseId'] === caseId) {
      return example
    }
  }
  return null
}

const uploadOrUpdateExample = async (
  client: Client,
  datasetId: string,
  caseId: string,
  input: { input: string },
  reference: { schema: Schema },
) => {
  const existingExample = await findExistingExample(client, datasetId, caseId)

  if (existingExample) {
    await client.updateExample({
      id: existingExample.id,
      inputs: input,
      outputs: reference,
    })
  } else {
    await client.createExample({
      inputs: input,
      outputs: reference,
      dataset_id: datasetId,
      metadata: { caseId },
    })
  }
}

type DatasetResult = Awaited<ReturnType<typeof Client.prototype.readDataset>>

const uploadExamples = (
  client: Client,
  dataset: DatasetResult,
  inputs: Array<{ caseId: string; data: { input: string } }>,
  references: Array<{ caseId: string; data: { schema: Schema } }>,
): ResultAsync<void, Error> => {
  const uploadExamplesPromise = async () => {
    for (const inputItem of inputs) {
      const reference = references.find((r) => r.caseId === inputItem.caseId)

      if (!reference) {
        console.warn(
          `⚠️  No reference found for case: ${inputItem.caseId}, skipping`,
        )
        continue
      }

      await uploadOrUpdateExample(
        client,
        dataset.id,
        inputItem.caseId,
        inputItem.data,
        reference.data,
      )
    }
  }

  return fromPromise(uploadExamplesPromise())
}

const uploadDataset = (
  config: LangSmithDatasetConfig,
): ResultAsync<void, Error> => {
  const client = new Client()

  const inputDir = join(config.workspacePath, 'execution', 'input')
  const referenceDir = join(config.workspacePath, 'execution', 'reference')

  const datasetResult = getOrCreateDataset(client, config.datasetName)
  const inputsResult = fromPromise(
    loadJsonFiles(inputDir, inputSchema, (value) =>
      typeof value === 'string' ? { input: value } : { input: value.input },
    ).then((result) => {
      if (result.isErr()) throw result.error
      return result.value
    }),
  )
  const referencesResult = fromPromise(
    loadJsonFiles(referenceDir, schemaSchema, (value) => ({
      schema: value,
    })).then((result) => {
      if (result.isErr()) throw result.error
      return result.value
    }),
  )

  return ResultAsync.combine([
    datasetResult,
    inputsResult,
    referencesResult,
  ]).andThen(([dataset, inputs, references]) =>
    uploadExamples(client, dataset, inputs, references),
  )
}

const runUploads = (datasets: Array<{ name: string; path: string }>) => {
  const results = datasets.map(({ name, path }) =>
    uploadDataset({
      datasetName: `schema-bench-${name}`,
      workspacePath: path,
    }),
  )
  return ResultAsync.combineWithAllErrors(results)
}

const main = async () => {
  // Parse dataset flags using existing utility
  const cliOptions = parseArgs(process.argv)

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

  const result = await runUploads(validDatasets)

  if (result.isErr()) {
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(handleUnexpectedError)
}
