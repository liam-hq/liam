import type { RawStmt } from '@pgsql/types'

export const parse = async (str: string): Promise<PgParseResult> => {
  // Filter out \restrict and \unrestrict lines from PostgreSQL 16.10+
  // These lines are added by pg_dump but are not valid SQL statements for parsing
  const filteredStr = str
    .split('\n')
    .filter((line) => {
      return !line.startsWith('\\restrict') && !line.startsWith('\\unrestrict')
    })
    .join('\n')

  // Dynamic import to avoid build-time issues
  // @ts-expect-error pg-query-emscripten does not have type definitions
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const Module = await import('pg-query-emscripten').then((m) => m.default)

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
