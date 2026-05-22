import {
  fromThrowable,
  fromValibotSafeParse,
  ResultAsync,
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
      { cause: error instanceof Error ? error : undefined },
    ),
)

export const countDependencies = async (
  repositoryFullName: string,
  ref: string,
): Promise<{ count: number } | { error: string }> => {
  const url = `https://raw.githubusercontent.com/${repositoryFullName}/${ref}/package.json`

  return new ResultAsync(downloadFileContent(url))
    .mapErr(
      (e) =>
        new Error(`Failed to download package.json from ${url}: ${e.message}`, {
          cause: e,
        }),
    )
    .andThen(parseJson)
    .andThen((parsed) =>
      fromValibotSafeParse(packageJsonSchema, parsed).mapErr(
        (e) =>
          new Error(`Invalid package.json structure: ${e.message}`, {
            cause: e,
          }),
      ),
    )
    .map((validated) => Object.keys(validated.dependencies ?? {}).length)
    .match(
      (count) => ({ count }),
      (error) => ({ error: error.message }),
    )
}
