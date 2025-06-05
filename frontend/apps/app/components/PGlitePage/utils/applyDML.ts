'use client'

import type { PGlite } from '@electric-sql/pglite'
import type { SqlResult } from './types'

/**
 * DML Execution Function (For Each Use Case)
 * Splits text into individual SQL statements, executes each one, and returns the results
 */
export const applyDML = async (
  dmlText: string,
  db: PGlite,
): Promise<SqlResult[]> => {
  const results: SqlResult[] = []

  // Split by ';' delimiter
  const statements = dmlText
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  // Execute each SQL statement sequentially
  for (const sql of statements) {
    const startTime = performance.now()
    try {
      const result = await db.query(sql)
      const executionTime = Math.round(performance.now() - startTime)

      // Get affected row count (if possible)
      let affectedRows: number | undefined = undefined
      if (result && typeof result === 'object' && 'rowCount' in result) {
        affectedRows = result.rowCount as number
      }

      results.push({
        sql,
        result,
        success: true,
        id: crypto.randomUUID(),
        metadata: {
          executionTime,
          affectedRows,
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
