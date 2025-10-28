import { pgParse } from '@liam-hq/schema/parser'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

/**
 * Validate SQL syntax using pgParse and return error message if validation fails
 *
 * @returns Error message string if validation fails, undefined if validation succeeds
 */
export const validateSqlSyntax = (sql: string): ResultAsync<void, string> => {
  return ResultAsync.fromSafePromise(pgParse(sql)).andThen((parseResult) => {
    if (parseResult.error) {
      return errAsync(
        `SQL syntax error: ${parseResult.error.message}. Fix the SQL and retry.`,
      )
    }
    return okAsync(undefined)
  })
}
