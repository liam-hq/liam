import { PGlite } from '@electric-sql/pglite'
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp'
import type { SqlResult } from './types'

/**
 * Manages PGlite database instances with immediate cleanup after query execution
 */
export class PGliteInstanceManager {
  /**
   * Creates a new PGlite instance for query execution
   * Includes required extensions and custom functions
   */
  private async createInstance(): Promise<PGlite> {
    const db = new PGlite({
      extensions: { uuid_ossp },
    })

    try {
      // Initialize required functions and extensions
      await db.exec(`
        -- Enable uuid-ossp extension for UUID generation
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- Create cuid function for custom ID generation
        CREATE OR REPLACE FUNCTION cuid(length INTEGER DEFAULT 25)
        RETURNS TEXT AS $$
        DECLARE
            chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
            result TEXT := '';
            i INTEGER := 0;
        BEGIN
            FOR i IN 1..length LOOP
                result := result || substr(chars, floor(random() * char_length(chars)) + 1, 1);
            END LOOP;
            RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `)
    } catch (error) {
      console.warn('Failed to initialize PGlite functions:', error)
      // Continue execution as basic PGlite functionality should still work
    }

    return db
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
