import type { DBStructure } from '../../../schema/index.js'
import { type ProcessError, UnexpectedTokenWarningError } from '../../errors.js'
import type { Processor } from '../../types.js'
import { convertToDBStructure } from './converter.js'
import { mergeDBStructures } from './mergeDBStructures.js'
import { parse } from './parser.js'
import { processSQLInChunks } from './processSQLInChunks.js'

/**
 * Processes SQL statements and constructs a database structure.
 */
export const processor: Processor = async (sql: string) => {
  const dbSchema: DBStructure = { tables: {}, relationships: {} }

  // Number of lines to process in a single chunk.
  // While a chunk size of around 1000 might work, running it on db/structure.sql
  // from https://gitlab.com/gitlab-org/gitlab-foss resulted in a memory error.
  // Keep this in mind when considering any adjustments.
  const CHUNK_SIZE = 500

  const parseErrors: ProcessError[] = []

  const errors = await processSQLInChunks(sql, CHUNK_SIZE, async (chunk) => {
    // Offset markers for chunk processing control:
    // - readOffset: Tracks the position after the last complete statement,
    //   used when a statement is partially processed and needs continuation
    // - retryOffset: Indicates where parsing failed and/or should be retried
    //   with a different chunk size (used in shrinking/expanding modes)
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
      errors.push(new UnexpectedTokenWarningError(parseError.message))
      retryOffset = parseError.cursorpos
      return [retryOffset, readOffset, errors]
    }

    let isLastStatementComplete = true
    const statementCount = parse_tree.stmts.length

    if (statementCount > 0) {
      const lastStmt = parse_tree.stmts[statementCount - 1]
      if (lastStmt?.stmt_len === undefined) {
        isLastStatementComplete = false
        if (lastStmt?.stmt_location === undefined) {
          retryOffset = 0 // no error, but the statement is not complete
          return [retryOffset, readOffset, errors]
        }
        readOffset = lastStmt?.stmt_location - 1
      }
    }

    const { value: convertedSchema, errors: conversionErrors } =
      convertToDBStructure(
        isLastStatementComplete
          ? parse_tree.stmts
          : parse_tree.stmts.slice(0, -1),
      )

    if (conversionErrors !== null) {
      parseErrors.push(...conversionErrors)
    }

    mergeDBStructures(dbSchema, convertedSchema)

    return [retryOffset, readOffset, errors]
  })

  return { value: dbSchema, errors: parseErrors.concat(errors) }
}
