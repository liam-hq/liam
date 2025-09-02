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
    const { db, supportedExtensions } =
      await this.createInstance(requiredExtensions)

    // Always filter CREATE EXTENSION statements based on supported extensions
    const filteredSql = filterExtensionDDL(sql, supportedExtensions)

    try {
      return await this.executeSql(filteredSql, db)
    } finally {
      db.close?.()
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
   * Extract individual SQL statements from the original SQL text using parsed AST metadata
   */
  private extractStatements(originalSql: string, stmts: RawStmt[]): string[] {
    if (stmts.length === 0) {
      return []
    }

    const statements: string[] = []

    for (let i = 0; i < stmts.length; i++) {
      const stmt = stmts[i]
      if (!stmt) continue

      const startPos = stmt.stmt_location || 0

      let endPos: number
      if (stmt.stmt_len !== undefined) {
        // Use explicit statement length if available
        endPos = startPos + stmt.stmt_len
      } else if (i < stmts.length - 1) {
        // Use start of next statement as end position
        const nextStmt = stmts[i + 1]
        endPos = nextStmt?.stmt_location || originalSql.length
      } else {
        // Last statement goes to end of string
        endPos = originalSql.length
      }

      const statementText = originalSql.slice(startPos, endPos).trim()
      if (statementText) {
        statements.push(statementText)
      }
    }

    return statements
  }
}
