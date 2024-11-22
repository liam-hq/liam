import type { RawStmt } from '@pgsql/types'
// @ts-expect-error
import Module from "pg-query-emscripten";

export const parse = async (str: string): Promise<RawStmtWrapper[]> => {
  const pgQuery = await new Module();
  return pgQuery.parse(str)

}

// It was expected that postgresParse would return a ParseResult object,
// but it was found that an array of RawStmtWrapper objects was returned.
export interface RawStmtWrapper {
  RawStmt: RawStmt
}
