import { err, ok, Result } from '@liam-hq/neverthrow'
import * as v from 'valibot'
import { schemaSchema } from '../../schema/index.js'
import type { ProcessResult } from '../types.js'

const parseJson = Result.fromThrowable(
  (s: string) => JSON.parse(s),
  (error) =>
    error instanceof Error ? error : new Error('Failed to parse JSON'),
)

const parseSchema = (
  data: unknown,
): Result<v.InferOutput<typeof schemaSchema>, Error> => {
  const result = v.safeParse(schemaSchema, data)
  if (result.success) {
    return ok(result.output)
  }
  const errorMessage = result.issues.map((issue) => issue.message).join(', ')
  return err(new Error(`Invalid Liam Schema format: ${errorMessage}`))
}

export const processor = async (str: string): Promise<ProcessResult> => {
  const result = parseJson(str).andThen(parseSchema)

  if (result.isOk()) {
    return {
      value: result.value,
      errors: [],
    }
  }

  return {
    value: { tables: {}, enums: {}, extensions: {} },
    errors: [result.error],
  }
}
