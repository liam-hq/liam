import * as v from 'valibot'
import { downloadFileContent } from './api.server'

const packageJsonSchema = v.object({
  dependencies: v.optional(v.record(v.string(), v.unknown())),
})

export async function countDependencies(
  repositoryFullName: string,
  ref: string,
): Promise<{ count: number } | { error: string }> {
  const url = `https://raw.githubusercontent.com/${repositoryFullName}/${ref}/package.json`

  const downloadResult = await downloadFileContent(url)
  if (downloadResult.isErr()) {
    return { error: downloadResult.error.message }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(downloadResult.value)
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Failed to parse package.json: ${error.message}`
          : 'Failed to parse package.json',
    }
  }

  const validation = v.safeParse(packageJsonSchema, parsed)
  if (!validation.success) {
    return { error: 'Invalid package.json structure' }
  }

  const dependencies = validation.output.dependencies ?? {}
  return { count: Object.keys(dependencies).length }
}
