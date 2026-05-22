import {
  err,
  fromThrowable,
  fromValibotSafeParse,
  ok,
  type Result,
} from '@liam-hq/neverthrow'
import * as v from 'valibot'
import { downloadFileContent } from './api.server'

const packageJsonSchema = v.object({
  dependencies: v.optional(v.record(v.string(), v.unknown())),
})

const parseJson = fromThrowable(
  (text: string): unknown => JSON.parse(text),
  (error) =>
    new Error(
      `Failed to parse package.json: ${error instanceof Error ? error.message : String(error)}`,
    ),
)

const countDependenciesResult = async (
  repositoryFullName: string,
  ref: string,
): Promise<Result<number, Error>> => {
  const url = `https://raw.githubusercontent.com/${repositoryFullName}/${ref}/package.json`

  const downloadResult = await downloadFileContent(url)
  if (downloadResult.isErr()) {
    return err(
      new Error(
        `Failed to download package.json from ${url}: ${downloadResult.error.message}`,
      ),
    )
  }

  const parsed = parseJson(downloadResult.value)
  if (parsed.isErr()) return err(parsed.error)

  const validated = fromValibotSafeParse(packageJsonSchema, parsed.value)
  if (validated.isErr()) {
    return err(
      new Error(`Invalid package.json structure: ${validated.error.message}`),
    )
  }

  return ok(Object.keys(validated.value.dependencies ?? {}).length)
}

export const countDependencies = async (
  repositoryFullName: string,
  ref: string,
): Promise<{ count: number } | { error: string }> => {
  const result = await countDependenciesResult(repositoryFullName, ref)
  return result.match(
    (count) => ({ count }),
    (error) => ({ error: error.message }),
  )
}
