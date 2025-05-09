import type { RawStmt } from '@pgsql/types'
// pg-query-emscripten does not have types, so we need to define them ourselves
// @ts-expect-error
import Module from 'pg-query-emscripten'

export const parse = async (str: string): Promise<ParseResult> => {
  const pgQuery = await new Module()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const result = pgQuery.parse(str)
  return result
}

// NOTE: pg-query-emscripten does not have types, so we need to define them ourselves
interface ParseResult {
  parse_tree: {
    version: number
    stmts: RawStmt[]
  }
  stderr_buffer: string
  error: {
    message: string
    funcname: string
    filename: string
    lineno: number
    cursorpos: number
    context: string
  } | null
}
