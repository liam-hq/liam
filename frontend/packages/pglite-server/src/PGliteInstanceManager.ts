import { PGlite } from '@electric-sql/pglite'
import type { SqlResult } from './types.ts'

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
   * Handles multiple statements separated by semicolons
   */
  private async executeSql(sqlText: string, db: PGlite): Promise<SqlResult[]> {
    const results: SqlResult[] = []

    // Split SQL text into individual statements
    const statements = sqlText
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)

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
}
