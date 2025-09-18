import { PGlite } from '@electric-sql/pglite'
import { type PgParseResult, pgParse } from '@liam-hq/schema/parser'
import type { RawStmt } from '@pgsql/types'
import { filterExtensionDDL, loadExtensions } from './extensionUtils'
import type { SqlResult } from './types'

/**
 * Manages PGlite database instances with immediate cleanup after query execution
 */
export class PGliteInstanceManager {
  /**
   * Creates a new PGlite instance for query execution
   * Returns both the instance and the list of supported extensions
   */
  private async createInstance(
    requiredExtensions: string[],
  ): Promise<{ db: PGlite; supportedExtensions: string[] }> {
    // Get memory configuration from environment or use default
    const memoryMb = Number(process.env['PGLITE_INITIAL_MEMORY_MB']) || 64
    const initialMemory = memoryMb * 1024 * 1024 // Convert MB to bytes

    if (requiredExtensions.length === 0) {
      return {
        db: new PGlite({
          initialMemory,
          extensions: {},
        }),
        supportedExtensions: [],
      }
    }

    const { extensionModules, supportedExtensionNames } =
      await loadExtensions(requiredExtensions)

    return {
      db: new PGlite({
        initialMemory,
        extensions: extensionModules,
      }),
      supportedExtensions: supportedExtensionNames,
    }
  }

  /**
   * Execute SQL query with immediate instance cleanup
   * Only executes DDL for supported extensions
   * @param signal - Optional AbortSignal for cancellation
   */
  async executeQuery(
    sql: string,
    requiredExtensions: string[],
    signal?: AbortSignal,
  ): Promise<SqlResult[]> {
    // Check if already aborted
    if (signal?.aborted) {
      // eslint-disable-next-line no-throw-error/no-throw-error -- AbortSignal requires throwing to propagate cancellation
      throw new Error(
        `Query execution aborted: ${signal.reason || 'cancelled'}`,
      )
    }

    const { db, supportedExtensions } =
      await this.createInstance(requiredExtensions)

    // Always filter CREATE EXTENSION statements based on supported extensions
    const filteredSql = filterExtensionDDL(sql, supportedExtensions)

    try {
      // Register abort handler to close database
      const abortHandler = () => {
        db.close?.()
      }
      signal?.addEventListener('abort', abortHandler)

      const results = await this.executeSql(filteredSql, db, signal)

      // Clean up abort handler
      signal?.removeEventListener('abort', abortHandler)

      return results
    } finally {
      // Ensure database is closed even if aborted
      db.close?.()
    }
  }

  /**
   * Execute SQL statements and return results with metadata
   * Uses PostgreSQL parser to properly handle complex statements including dollar-quoted strings
   */
  private async executeSql(
    sqlText: string,
    db: PGlite,
    signal?: AbortSignal,
  ): Promise<SqlResult[]> {
    try {
      // Check abort before parsing
      if (signal?.aborted) {
        // eslint-disable-next-line no-throw-error/no-throw-error -- AbortSignal requires throwing to propagate cancellation
        throw new Error(
          `Query execution aborted: ${signal.reason || 'cancelled'}`,
        )
      }

      const parseResult: PgParseResult = await pgParse(sqlText)

      if (parseResult.error) {
        return [this.createParseErrorResult(sqlText, parseResult.error.message)]
      }

      const statements = this.extractStatements(
        sqlText,
        parseResult.parse_tree.stmts,
      )
      return await this.executeStatements(statements, db, signal)
    } catch (error) {
      // Check if aborted
      if (signal?.aborted) {
        // eslint-disable-next-line no-throw-error/no-throw-error -- AbortSignal requires throwing to propagate cancellation
        throw new Error(
          `Query execution aborted: ${signal.reason || 'cancelled'}`,
        )
      }
      return await this.executeFallback(sqlText, db, error)
    }
  }

  /**
   * Create a parse error result
   */
  private createParseErrorResult(
    sqlText: string,
    errorMessage: string,
  ): SqlResult {
    return {
      sql: sqlText,
      result: { error: `Parse error: ${errorMessage}` },
      success: false,
      id: crypto.randomUUID(),
      metadata: {
        executionTime: 0,
        timestamp: new Date().toLocaleString(),
      },
    }
  }

  /**
   * Execute multiple SQL statements
   */
  private async executeStatements(
    statements: string[],
    db: PGlite,
    signal?: AbortSignal,
  ): Promise<SqlResult[]> {
    const results: SqlResult[] = []

    for (const sql of statements) {
      // Check for abort before each statement
      if (signal?.aborted) {
        // eslint-disable-next-line no-throw-error/no-throw-error -- AbortSignal requires throwing to propagate cancellation
        throw new Error(
          `Query execution aborted: ${signal.reason || 'cancelled'}`,
        )
      }

      const result = await this.executeSingleStatement(sql, db, signal)
      results.push(result)
    }

    return results
  }

  /**
   * Execute a single SQL statement
   */
  private async executeSingleStatement(
    sql: string,
    db: PGlite,
    signal?: AbortSignal,
  ): Promise<SqlResult> {
    const startTime = performance.now()

    try {
      // Check for abort before executing query
      if (signal?.aborted) {
        // eslint-disable-next-line no-throw-error/no-throw-error -- AbortSignal requires throwing to propagate cancellation
        throw new Error(
          `Query execution aborted: ${signal.reason || 'cancelled'}`,
        )
      }

      const result = await db.query(sql)
      const executionTime = Math.round(performance.now() - startTime)

      return {
        sql,
        result,
        success: true,
        id: crypto.randomUUID(),
        metadata: {
          executionTime,
          timestamp: new Date().toLocaleString(),
        },
      }
    } catch (error) {
      const executionTime = Math.round(performance.now() - startTime)

      // Re-throw abort errors
      if (signal?.aborted) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)

      return {
        sql,
        result: { error: errorMessage },
        success: false,
        id: crypto.randomUUID(),
        metadata: {
          executionTime,
          timestamp: new Date().toLocaleString(),
        },
      }
    }
  }

  /**
   * Fallback to simple SQL splitting when parsing fails
   */
  private async executeFallback(
    sqlText: string,
    db: PGlite,
    error: unknown,
  ): Promise<SqlResult[]> {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(
      `SQL parsing failed, falling back to simple split: ${errorMessage}`,
    )

    const statements = sqlText
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)

    return await this.executeStatements(statements, db)
  }

  /**
   * Convert byte position to character position in a string
   * PostgreSQL parser returns byte positions, but JavaScript uses character positions
   */
  private byteToCharPosition(str: string, bytePos: number): number {
    if (bytePos === 0) return 0

    const encoder = new TextEncoder()
    let currentBytePos = 0
    let charPos = 0

    for (const char of str) {
      const charBytes = encoder.encode(char)
      const nextBytePos = currentBytePos + charBytes.length

      if (nextBytePos > bytePos) {
        // We've gone past the target byte position
        break
      }

      currentBytePos = nextBytePos
      // For surrogate pairs and multi-byte chars, char.length might be > 1
      charPos += char.length
    }

    return charPos
  }

  /**
   * Get valid start byte position from statement
   */
  private getStartBytePos(stmt: RawStmt, sqlByteLength: number): number {
    // Handle stmt_location: -1 means unknown/invalid position
    // Only use stmt_location if it's a valid non-negative number
    let startBytePos = 0
    if (stmt.stmt_location !== undefined && stmt.stmt_location >= 0) {
      startBytePos = stmt.stmt_location
    }
    // Clamp start position to valid range
    return Math.max(0, Math.min(startBytePos, sqlByteLength))
  }

  /**
   * Get valid end byte position for statement
   */
  private getEndBytePos(
    stmt: RawStmt,
    nextStmt: RawStmt | undefined,
    startBytePos: number,
    sqlByteLength: number,
  ): number {
    // Use explicit statement length if available and valid
    if (stmt.stmt_len !== undefined && stmt.stmt_len > 0) {
      return startBytePos + stmt.stmt_len
    }

    // Try to use next statement's start position if valid
    if (nextStmt?.stmt_location !== undefined && nextStmt.stmt_location >= 0) {
      return nextStmt.stmt_location
    }

    // Fallback to end of SQL
    return sqlByteLength
  }

  /**
   * Extract individual SQL statements from the original SQL text using parsed AST metadata
   */
  private extractStatements(originalSql: string, stmts: RawStmt[]): string[] {
    if (stmts.length === 0) {
      return []
    }

    const statements: string[] = []
    const sqlByteLength = new TextEncoder().encode(originalSql).length

    for (let i = 0; i < stmts.length; i++) {
      const stmt = stmts[i]
      if (!stmt) continue

      const startBytePos = this.getStartBytePos(stmt, sqlByteLength)
      const startPos = this.byteToCharPosition(originalSql, startBytePos)

      const nextStmt = i < stmts.length - 1 ? stmts[i + 1] : undefined
      let endBytePos = this.getEndBytePos(
        stmt,
        nextStmt,
        startBytePos,
        sqlByteLength,
      )

      // Clamp end position to valid range and ensure it's not before start
      endBytePos = Math.max(startBytePos, Math.min(endBytePos, sqlByteLength))
      const endPos = this.byteToCharPosition(originalSql, endBytePos)

      const statementText = originalSql.slice(startPos, endPos).trim()
      if (statementText) {
        statements.push(statementText)
      }
    }

    return statements
  }
}
