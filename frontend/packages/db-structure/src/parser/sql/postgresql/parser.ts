import type { RawStmt } from '@pgsql/types'
// pg-query-emscripten does not have types, so we need to define them ourselves
// @ts-expect-error
import Module from 'pg-query-emscripten'

export const parse = async (str: string): Promise<RawStmtWrapper[]> => {
  const pgQuery = await new Module()
  const result = pgQuery.parse(str)
  // should we have --verbose or --debug mode?
  if (result.error) console.error(result.error)
  return result
}

// It was expected that postgresParse would return a ParseResult object,
// but it was found that an array of RawStmtWrapper objects was returned.
export interface RawStmtWrapper {
  RawStmt: RawStmt
}
