import type { RawStmt } from '@pgsql/types'
// pg-query-emscripten does not have types, so we need to define them ourselves
// @ts-expect-error
import Module from 'pg-query-emscripten'

export const parse = async (str: string): Promise<PgParseResult> => {
  const pgQuery = await new Module({
    wasmMemory: new WebAssembly.Memory({
      initial: 2048, // 128MB (64KB × 2048 pages)
      maximum: 4096, // 256MB max
    }),
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const result = pgQuery.parse(str)
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
