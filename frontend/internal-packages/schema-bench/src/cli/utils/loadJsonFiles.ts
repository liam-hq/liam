import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  err,
  fromPromise,
  ok,
  type Result,
  Result as ResultClass,
} from '@liam-hq/neverthrow'
import * as v from 'valibot'

/**
 * Load and validate JSON files from a specified directory.
 * Generic function that can be used for both input and reference files.
 */
export async function loadJsonFiles<
  Schema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
  T,
>(
  directory: string,
  schema: Schema,
  normalize: (value: v.InferOutput<Schema>) => T,
): Promise<Result<Array<{ caseId: string; data: T }>, Error>> {
  if (!existsSync(directory)) {
    return err(new Error(`Directory not found: ${directory}`))
  }

  const filesResult = await fromPromise(readdir(directory), (error) =>
    error instanceof Error ? error : new Error('Failed to read directory'),
  )
  if (filesResult.isErr()) return err(filesResult.error)

  const jsonFiles = filesResult.value.filter((file) => file.endsWith('.json'))
  const results: Array<{ caseId: string; data: T }> = []

  for (const file of jsonFiles) {
    const caseId = file.replace('.json', '')
    const contentResult = await fromPromise(
      readFile(join(directory, file), 'utf-8'),
      (error) =>
        error instanceof Error
          ? error
          : new Error(`Failed to read file ${file}`),
    )
    if (contentResult.isErr()) return err(contentResult.error)

    const parseResult = ResultClass.fromThrowable(
      () => JSON.parse(contentResult.value),
      (error) =>
        error instanceof Error
          ? error
          : new Error(`Failed to parse JSON in ${file}`),
    )()
    if (parseResult.isErr()) return err(parseResult.error)

    const validationResult = v.safeParse(schema, parseResult.value)
    if (!validationResult.success) {
      return err(
        new Error(
          `Invalid format in ${file}: ${JSON.stringify(validationResult.issues)}`,
        ),
      )
    }

    const normalized: T = normalize(validationResult.output)
    results.push({ caseId, data: normalized })
  }

  return ok(results)
}
