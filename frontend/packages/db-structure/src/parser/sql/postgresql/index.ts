import type { RawStmt } from '@pgsql/types'
import type { Schema } from '../../../schema/index.js'
import { type ProcessError, UnexpectedTokenWarningError } from '../../errors.js'
import type { Processor } from '../../types.js'
import { convertToSchema } from './converter.js'
import { mergeSchemas } from './mergeSchemas.js'
import { parse } from './parser.js'
import { processSQLInChunks } from './processSQLInChunks.js'

/**
 * Handles parse errors and returns offset information
 */
function handleParseError(parseError: { message: string; cursorpos: number }): [
  number | null,
  number | null,
  ProcessError[],
] {
  const errors: ProcessError[] = [
    new UnexpectedTokenWarningError(parseError.message),
  ]
  const retryOffset = parseError.cursorpos
  return [retryOffset, null, errors]
}

/**
 * Processes the last statement and determines if it's complete
 */
function processLastStatement(
  stmts: RawStmt[],
): [boolean, number | null, number | null] {
  let isLastStatementComplete = true
  let readOffset: number | null = null
  let retryOffset: number | null = null

  if (stmts.length > 0) {
    const lastStmt = stmts[stmts.length - 1]
    if (lastStmt?.stmt_len === undefined) {
      isLastStatementComplete = false
      if (lastStmt?.stmt_location === undefined) {
        retryOffset = 0 // no error, but the statement is not complete
      } else {
        readOffset = lastStmt.stmt_location - 1
      }
    }
  }

  return [isLastStatementComplete, readOffset, retryOffset]
}

/**
 * Processes a single SQL chunk
 */
async function processChunk(
  chunk: string,
  schema: Schema,
  parseErrors: ProcessError[],
  rawSql: string,
): Promise<[number | null, number | null, ProcessError[]]> {
  let readOffset: number | null = null
  let retryOffset: number | null = null
  const errors: ProcessError[] = []

  const { parse_tree, error: parseError } = await parse(chunk)

  if (parse_tree.stmts.length > 0 && parseError !== null) {
    throw new Error(
      'UnexpectedCondition. parse_tree.stmts.length > 0 && parseError !== null',
    )
  }

  if (parseError !== null) {
    return handleParseError(parseError)
  }

  const [isLastStatementComplete, lastReadOffset, lastRetryOffset] =
    processLastStatement(parse_tree.stmts)

  readOffset = lastReadOffset
  retryOffset = lastRetryOffset

  if (retryOffset !== null) {
    return [retryOffset, readOffset, errors]
  }

  const { value: convertedSchema, errors: conversionErrors } = convertToSchema(
    isLastStatementComplete ? parse_tree.stmts : parse_tree.stmts.slice(0, -1),
    rawSql,
  )

  if (conversionErrors !== null) {
    parseErrors.push(...conversionErrors)
  }

  mergeSchemas(schema, convertedSchema)

  return [retryOffset, readOffset, errors]
}

/**
 * Processes SQL statements and constructs a schema.
 */
export const processor: Processor = async (sql: string) => {
  const schema: Schema = {
    tables: {},
    relationships: {},
    tableGroups: {},
  }

  // Number of lines to process in a single chunk.
  // While a chunk size of around 1000 might work, running it on db/structure.sql
  // from https://gitlab.com/gitlab-org/gitlab-foss resulted in a memory error.
  // Keep this in mind when considering any adjustments.
  const CHUNK_SIZE = 500

  const parseErrors: ProcessError[] = []

  const errors = await processSQLInChunks(sql, CHUNK_SIZE, async (chunk) => {
    return processChunk(chunk, schema, parseErrors, sql)
  })

  return { value: schema, errors: parseErrors.concat(errors) }
}
