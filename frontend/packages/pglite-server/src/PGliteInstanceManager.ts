import { PGlite } from '@electric-sql/pglite'
import type { PGliteInstance, QueryType, SqlResult } from './types'

export class PGliteInstanceManager {
  private instances = new Map<string, PGliteInstance>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupInactiveInstances()
      },
      5 * 60 * 1000,
    )
  }

  async getOrCreateInstance(sessionId: string): Promise<PGlite> {
    const existing = this.instances.get(sessionId)
    if (existing) {
      existing.lastAccessed = new Date()
      return existing.db
    }

    const db = new PGlite()
    this.instances.set(sessionId, {
      db,
      lastAccessed: new Date(),
    })
    return db
  }

  private cleanupInactiveInstances() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    for (const [sessionId, instance] of Array.from(this.instances.entries())) {
      if (instance.lastAccessed < thirtyMinutesAgo) {
        instance.db.close?.()
        this.instances.delete(sessionId)
      }
    }
  }

  async executeQuery(
    sessionId: string,
    sql: string,
    type: QueryType,
  ): Promise<SqlResult[]> {
    const db = await this.getOrCreateInstance(sessionId)

    if (type === 'DDL') {
      return this.applyDDL(sql, db)
    }
    return this.applyDML(sql, db)
  }

  private async applyDDL(ddlText: string, db: PGlite): Promise<SqlResult[]> {
    const results: SqlResult[] = []

    const statements = ddlText
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)

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

  private async applyDML(dmlText: string, db: PGlite): Promise<SqlResult[]> {
    const results: SqlResult[] = []

    const statements = dmlText
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)

    for (const sql of statements) {
      const startTime = performance.now()
      try {
        const result = await db.query(sql)
        const executionTime = Math.round(performance.now() - startTime)

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

  destroy() {
    clearInterval(this.cleanupInterval)
    for (const [, instance] of Array.from(this.instances.entries())) {
      instance.db.close?.()
    }
    this.instances.clear()
  }
}
