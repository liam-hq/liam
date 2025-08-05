import { PGlite } from '@electric-sql/pglite'
import type { SqlResult } from './types'

/**
 * Manages PGlite database instances with immediate cleanup after query execution
 */
export class PGliteInstanceManager {
  /**
   * Creates a new PGlite instance for query execution
   */
  private async createInstance(): Promise<PGlite> {
    return new PGlite()
  }

  /**
   * Execute SQL query with immediate instance cleanup
   */
  async executeQuery(_sessionId: string, sql: string): Promise<SqlResult[]> {
    const db = await this.createInstance()
    try {
      return await this.executeSql(sql, db)
    } finally {
      db.close?.()
    }
  }

  /**
   * Execute SQL statements and return results with metadata
   * Handles multiple statements using PostgreSQL parser to properly handle dollar-quoted strings
   */
  private async executeSql(sqlText: string, db: PGlite): Promise<SqlResult[]> {
    const results: SqlResult[] = []

    const statements = await this.extractSqlStatements(sqlText)

    // Execute each statement and collect results
    for (const sql of statements) {
      const startTime = performance.now()
      try {
        const result = await db.query(sql)
        const executionTime = Math.round(performance.now() - startTime)
        results.push({
          sql,
          result,
          success: true,
          id: crypto.randomUUID(),
          metadata: {
            executionTime,
            timestamp: new Date().toLocaleString(),
          },
        })
      } catch (error) {
        const executionTime = Math.round(performance.now() - startTime)
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        results.push({
          sql,
          result: { error: errorMessage },
          success: false,
          id: crypto.randomUUID(),
          metadata: {
            executionTime,
            timestamp: new Date().toLocaleString(),
          },
        })
      }
    }

    return results
  }

  /**
   * Extract individual SQL statements from SQL text using PostgreSQL parser
   * Falls back to semicolon splitting if parsing fails
   */
  private async extractSqlStatements(sqlText: string): Promise<string[]> {
    try {
      // Use a simple state machine to properly split SQL while respecting dollar-quoted strings
      return this.splitSqlStatements(sqlText)
    } catch (error) {
      return this.fallbackSqlSplit(sqlText)
    }
  }

  /**
   * Split SQL statements while properly handling dollar-quoted strings
   * This is a simplified parser that handles the most common cases
   */
  private splitSqlStatements(sqlText: string): string[] {
    const statements: string[] = []
    let currentStatement = ''
    let i = 0

    while (i < sqlText.length) {
      const char = sqlText[i]

      if (char === '$') {
        const dollarQuoteMatch = sqlText.substring(i).match(/^\$([^$]*)\$/)
        if (dollarQuoteMatch) {
          const tag = dollarQuoteMatch[1]
          const startTag = `$${tag}$`
          const endTag = `$${tag}$`

          currentStatement += startTag
          i += startTag.length

          const endIndex = sqlText.indexOf(endTag, i)
          if (endIndex !== -1) {
            currentStatement += sqlText.substring(i, endIndex + endTag.length)
            i = endIndex + endTag.length
          } else {
            i++
          }
          continue
        }
      }

      // Check for single-quoted strings
      if (char === "'") {
        currentStatement += char
        i++
        while (i < sqlText.length) {
          const nextChar = sqlText[i]
          currentStatement += nextChar
          if (nextChar === "'") {
            if (i + 1 < sqlText.length && sqlText[i + 1] === "'") {
              currentStatement += sqlText[i + 1]
              i += 2
            } else {
              i++
              break
            }
          } else {
            i++
          }
        }
        continue
      }

      if (char === '"') {
        currentStatement += char
        i++
        while (i < sqlText.length && sqlText[i] !== '"') {
          currentStatement += sqlText[i]
          i++
        }
        if (i < sqlText.length) {
          currentStatement += sqlText[i] // Add closing quote
          i++
        }
        continue
      }

      if (char === ';') {
        const trimmedStatement = currentStatement.trim()
        if (trimmedStatement) {
          statements.push(trimmedStatement)
        }
        currentStatement = ''
        i++
        continue
      }

      currentStatement += char
      i++
    }

    const trimmedStatement = currentStatement.trim()
    if (trimmedStatement) {
      statements.push(trimmedStatement)
    }

    return statements.filter(Boolean)
  }

  /**
   * Fallback SQL splitting using semicolons (original behavior)
   */
  private fallbackSqlSplit(sqlText: string): string[] {
    return sqlText
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
  }
}
