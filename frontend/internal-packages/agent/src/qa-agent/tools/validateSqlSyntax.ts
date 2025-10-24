import { pgParse } from '@liam-hq/schema/parser'

/**
 * Validate SQL syntax using pgParse and return error message if validation fails
 *
 * @returns Error message string if validation fails, undefined if validation succeeds
 */
export const validateSqlSyntax = async (
  sql: string,
): Promise<string | undefined> => {
  const parseResult = await pgParse(sql)

  if (parseResult.error) {
    return `SQL syntax error: ${parseResult.error.message}. Fix the SQL and retry.`
  }

  return undefined
}
