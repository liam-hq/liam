import type { RawStmt } from '@pgsql/types'
// pg-query-emscripten does not have types, so we need to define them ourselves
// @ts-expect-error
import Module from 'pg-query-emscripten'

export const parse = async (str: string): Promise<PgParseResult> => {
  // Filter out \restrict and \unrestrict lines from PostgreSQL 16.10+
  // These lines are added by pg_dump but are not valid SQL statements for parsing
  const filteredStr = str
    .split('\n')
    .filter((line) => {
      return !line.startsWith('\\restrict') && !line.startsWith('\\unrestrict')
    })
    .join('\n')

  const pgQuery = await new Module({
    wasmMemory: new WebAssembly.Memory({
      initial: 2048, // 128MB (64KB × 2048 pages)
      maximum: 4096, // 256MB max
    }),
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const result = pgQuery.parse(filteredStr)
  return result
}

// NOTE: pg-query-emscripten does not have types, so we need to define them ourselves
export type PgParseResult = {
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
