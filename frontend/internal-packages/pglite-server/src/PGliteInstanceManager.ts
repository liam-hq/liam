import { type Extensions, PGlite } from '@electric-sql/pglite'
import { type PgParseResult, pgParse } from '@liam-hq/schema/parser'
import type { RawStmt } from '@pgsql/types'
import type { SqlResult } from './types'

// Extension import paths for all supported extensions
const EXTENSION_IMPORTS: Record<string, string> = {
  // Native/Plugin extensions
  live: '@electric-sql/pglite/live',
  vector: '@electric-sql/pglite/vector',
  pg_ivm: '@electric-sql/pglite/pg_ivm',
  // Contrib extensions
  amcheck: '@electric-sql/pglite/contrib/amcheck',
  auto_explain: '@electric-sql/pglite/contrib/auto_explain',
  bloom: '@electric-sql/pglite/contrib/bloom',
  btree_gin: '@electric-sql/pglite/contrib/btree_gin',
  btree_gist: '@electric-sql/pglite/contrib/btree_gist',
  citext: '@electric-sql/pglite/contrib/citext',
  cube: '@electric-sql/pglite/contrib/cube',
  earthdistance: '@electric-sql/pglite/contrib/earthdistance',
  fuzzystrmatch: '@electric-sql/pglite/contrib/fuzzystrmatch',
  hstore: '@electric-sql/pglite/contrib/hstore',
  isn: '@electric-sql/pglite/contrib/isn',
  lo: '@electric-sql/pglite/contrib/lo',
  ltree: '@electric-sql/pglite/contrib/ltree',
  pg_trgm: '@electric-sql/pglite/contrib/pg_trgm',
  seg: '@electric-sql/pglite/contrib/seg',
  tablefunc: '@electric-sql/pglite/contrib/tablefunc',
  tcn: '@electric-sql/pglite/contrib/tcn',
  tsm_system_rows: '@electric-sql/pglite/contrib/tsm_system_rows',
  tsm_system_time: '@electric-sql/pglite/contrib/tsm_system_time',
  uuid_ossp: '@electric-sql/pglite/contrib/uuid_ossp',
}

/**
 * Manages PGlite database instances with immediate cleanup after query execution
 */
export class PGliteInstanceManager {
  /**
   * Normalize extension name to match PGlite supported format
   */
  private normalizeExtensionName(name: string): string {
    const normalized = name.toLowerCase().trim()
    // Special case: uuid-ossp needs to be converted to uuid_ossp for PGlite import
    return normalized === 'uuid-ossp' ? 'uuid_ossp' : normalized
  }

  /**
   * Load and filter extensions for PGlite
   */
  private async loadExtensions(
    requiredExtensions: string[],
  ): Promise<Extensions> {
    const extensions: Extensions = {}

    for (const ext of requiredExtensions) {
      const normalizedExt = this.normalizeExtensionName(ext)

      // Check if extension import path is available
      const importPath = EXTENSION_IMPORTS[normalizedExt]
      if (importPath) {
        const module = await import(importPath)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        extensions[normalizedExt] = module[normalizedExt]
      } else {
        console.warn(
          `Extension '${ext}' is not supported in PGlite environment`,
        )
      }
    }

    return extensions
  }

  /**
   * Creates a new PGlite instance for query execution
   */
  private async createInstance(requiredExtensions?: string[]): Promise<PGlite> {
    const extensions =
      requiredExtensions && requiredExtensions.length > 0
        ? await this.loadExtensions(requiredExtensions)
        : {}

    return new PGlite({
      initialMemory: 2 * 1024 * 1024 * 1024, // 2GB initial memory allocation
      extensions,
    })
  }

  /**
   * Execute SQL query with immediate instance cleanup
   */
  async executeQuery(
    sql: string,
    requiredExtensions?: string[],
  ): Promise<SqlResult[]> {
    const db = await this.createInstance(requiredExtensions)
    try {
      return await this.executeSql(sql, db)
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
