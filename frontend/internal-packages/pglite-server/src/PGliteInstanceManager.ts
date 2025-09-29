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
    if (requiredExtensions.length === 0) {
      return {
        db: new PGlite({
          initialMemory: 2 * 1024 * 1024 * 1024, // 2GB initial memory allocation
          extensions: {},
        }),
        supportedExtensions: [],
      }
    }

    const { extensionModules, supportedExtensionNames } =
      await loadExtensions(requiredExtensions)

    return {
      db: new PGlite({
        initialMemory: 2 * 1024 * 1024 * 1024, // 2GB initial memory allocation
        extensions: extensionModules,
      }),
      supportedExtensions: supportedExtensionNames,
    }
  }

  /**
   * Execute SQL query with immediate instance cleanup
   * Only executes DDL for supported extensions
   */
  async executeQuery(
    sql: string,
    requiredExtensions: string[],
  ): Promise<SqlResult[]> {
    // Log memory usage before creating PGlite instance
    const memoryBefore = process.memoryUsage()
    console.info('[PGlite] Before instance creation:', {
      rss: `${Math.round(memoryBefore.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryBefore.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryBefore.external / 1024 / 1024)} MB`,
    })

    const { db, supportedExtensions } =
      await this.createInstance(requiredExtensions)

    // Log memory usage after creating PGlite instance
    const memoryAfter = process.memoryUsage()
    console.info('[PGlite] After instance creation:', {
      rss: `${Math.round(memoryAfter.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryAfter.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryAfter.external / 1024 / 1024)} MB`,
      rssDelta: `+${Math.round((memoryAfter.rss - memoryBefore.rss) / 1024 / 1024)} MB`,
    })

    // Always filter CREATE EXTENSION statements based on supported extensions
    const filteredSql = filterExtensionDDL(sql, supportedExtensions)

    try {
      return await this.executeSql(filteredSql, db)
    } finally {
      db.close?.()
      // Log memory usage after closing instance
      const memoryAfterClose = process.memoryUsage()
      console.info('[PGlite] After instance close:', {
        rss: `${Math.round(memoryAfterClose.rss / 1024 / 1024)} MB`,
        rssDelta: `${Math.round((memoryAfterClose.rss - memoryAfter.rss) / 1024 / 1024)} MB from after creation`,
      })
    }
  }

  /**
   * Execute SQL statements and return results with metadata
   * Uses PostgreSQL parser to properly handle complex statements including dollar-quoted strings
   */
  private async executeSql(sqlText: string, db: PGlite): Promise<SqlResult[]> {
    try {
      const parseResult: PgParseResult = await pgParse(sqlText)

      if (parseResult.error) {
        return [this.createParseErrorResult(sqlText, parseResult.error.message)]
      }

      const statements = this.extractStatements(
        sqlText,
        parseResult.parse_tree.stmts,
      )
      return await this.executeStatements(statements, db)
    } catch (error) {
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
  ): Promise<SqlResult[]> {
    const results: SqlResult[] = []

    for (const sql of statements) {
      const result = await this.executeSingleStatement(sql, db)
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
  ): Promise<SqlResult> {
    const startTime = performance.now()

    try {
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
