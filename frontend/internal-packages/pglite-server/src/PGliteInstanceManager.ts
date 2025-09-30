import { PGlite } from '@electric-sql/pglite'
import { type PgParseResult, pgParse } from '@liam-hq/schema/parser'
import type { RawStmt } from '@pgsql/types'
import { filterExtensionDDL, loadExtensions } from './extensionUtils'
import type { SqlResult } from './types'

/**
 * Manages PGlite database instances with pooling for concurrent execution
 */
export class PGliteInstanceManager {
  // Instance pool for round-robin distribution
  private static instancePool: PGlite[] = []
  private static supportedExtensionsPool: string[][] = []
  private static loadedExtensionsPool: string[][] = []
  private static currentIndex = 0
  // Pool size configurable via environment variable (default: 24 for maximum parallelism)
  private static readonly POOL_SIZE = Number(
    process.env['PGLITE_POOL_SIZE'] || '24',
  )

  // DDL and transaction state tracking for each instance
  private static instanceDDLHash: Map<number, string> = new Map()
  private static instanceHasTransaction: Map<number, boolean> = new Map()

  /**
   * Creates a new PGlite instance for query execution
   * Returns both the instance and the list of supported extensions
   */
  private async createInstance(
    requiredExtensions: string[],
  ): Promise<{ db: PGlite; supportedExtensions: string[] }> {
    const startTime = Date.now()

    if (requiredExtensions.length === 0) {
      const db = new PGlite({
        initialMemory: 256 * 1024 * 1024, // Reduced from 2GB to 256MB
        extensions: {},
      })
      console.info(
        `[PGlite] Instance creation took: ${Date.now() - startTime}ms`,
      )
      return {
        db,
        supportedExtensions: [],
      }
    }

    const { extensionModules, supportedExtensionNames } =
      await loadExtensions(requiredExtensions)

    const db = new PGlite({
      initialMemory: 256 * 1024 * 1024, // Reduced from 2GB to 256MB
      extensions: extensionModules,
    })
    console.info(`[PGlite] Instance creation took: ${Date.now() - startTime}ms`)

    return {
      db,
      supportedExtensions: supportedExtensionNames,
    }
  }

  /**
   * Check if required extensions match loaded extensions
   */
  private extensionsMatch(required: string[], loaded: string[]): boolean {
    // Normalize and sort both arrays for comparison
    const normalizedRequired = [...required].sort()
    const normalizedLoaded = [...loaded].sort()

    // Check if arrays have same length and same elements
    if (normalizedRequired.length !== normalizedLoaded.length) {
      return false
    }

    return normalizedRequired.every(
      (ext, index) => ext === normalizedLoaded[index],
    )
  }

  /**
   * Initialize the instance pool with required extensions
   */
  private async initializePool(requiredExtensions: string[]): Promise<void> {
    console.info(
      `[PGlite] Initializing pool with ${PGliteInstanceManager.POOL_SIZE} instances`,
    )

    for (let i = 0; i < PGliteInstanceManager.POOL_SIZE; i++) {
      console.info(
        `[PGlite] Creating instance ${i + 1}/${PGliteInstanceManager.POOL_SIZE}`,
      )
      const { db, supportedExtensions } =
        await this.createInstance(requiredExtensions)

      PGliteInstanceManager.instancePool.push(db)
      PGliteInstanceManager.supportedExtensionsPool.push(supportedExtensions)
      PGliteInstanceManager.loadedExtensionsPool.push(requiredExtensions)
    }

    console.info('[PGlite] Pool initialization complete')
  }

  /**
   * Recreate the entire pool with new extensions
   */
  private async recreatePool(requiredExtensions: string[]): Promise<void> {
    console.info('[PGlite] Extensions changed, recreating pool')

    // Close all existing instances
    for (const instance of PGliteInstanceManager.instancePool) {
      await instance.close()
    }

    // Clear the pools
    PGliteInstanceManager.instancePool = []
    PGliteInstanceManager.supportedExtensionsPool = []
    PGliteInstanceManager.loadedExtensionsPool = []
    PGliteInstanceManager.currentIndex = 0
    // Clear state tracking maps
    PGliteInstanceManager.instanceDDLHash.clear()
    PGliteInstanceManager.instanceHasTransaction.clear()

    // Reinitialize with new extensions
    await this.initializePool(requiredExtensions)
  }

  /**
   * Get or create an instance from the pool using round-robin
   */
  private async getOrCreateInstance(
    requiredExtensions: string[],
  ): Promise<{ db: PGlite; supportedExtensions: string[] }> {
    // Initialize pool if empty
    if (PGliteInstanceManager.instancePool.length === 0) {
      await this.initializePool(requiredExtensions)
    }

    // Check if extensions have changed (compare with first instance's extensions)
    const firstLoadedExtensions = PGliteInstanceManager.loadedExtensionsPool[0]
    if (
      firstLoadedExtensions &&
      !this.extensionsMatch(requiredExtensions, firstLoadedExtensions)
    ) {
      await this.recreatePool(requiredExtensions)
    }

    // Get the next instance in round-robin fashion
    const index = PGliteInstanceManager.currentIndex
    PGliteInstanceManager.currentIndex =
      (PGliteInstanceManager.currentIndex + 1) % PGliteInstanceManager.POOL_SIZE

    console.info(
      `[PGlite] Using instance ${index + 1}/${PGliteInstanceManager.POOL_SIZE} from pool`,
    )

    const instance = PGliteInstanceManager.instancePool[index]
    const supportedExtensions =
      PGliteInstanceManager.supportedExtensionsPool[index]

    if (!instance || !supportedExtensions) {
      // This should never happen if pool is properly initialized
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error(`Instance ${index} not found in pool`)
    }

    return {
      db: instance,
      supportedExtensions,
    }
  }

  /**
   * Split SQL into DDL and DML parts based on comment markers
   */
  private splitDDLandDML(sql: string): { ddl: string; dml: string } {
    // Look for the "-- DDL Statements" marker to identify DDL section
    const ddlMarker = '-- DDL Statements'
    const testCaseMarker = '-- Test Case:'

    const ddlStart = sql.indexOf(ddlMarker)
    const testCaseStart = sql.indexOf(testCaseMarker)

    if (ddlStart !== -1 && testCaseStart !== -1) {
      // We have both DDL and test case sections
      const ddl = sql
        .substring(ddlStart + ddlMarker.length, testCaseStart)
        .trim()
      const dml = sql.substring(testCaseStart).trim()
      return { ddl, dml }
    }
    if (ddlStart !== -1) {
      // Only DDL section
      const ddl = sql.substring(ddlStart + ddlMarker.length).trim()
      return { ddl, dml: '' }
    }
    // No clear DDL marker, treat entire SQL as regular query (not DDL/DML)
    return { ddl: '', dml: '' }
  }

  /**
   * Generate hash for DDL statements to detect changes
   */
  private generateDDLHash(ddl: string): string {
    // Simple hash using string content
    let hash = 0
    for (let i = 0; i < ddl.length; i++) {
      const char = ddl.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  /**
   * Execute SQL query with savepoint-based transaction isolation
   * DDL statements are executed once per instance
   * DML statements use savepoints for efficient rollback
   */
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Savepoint transaction management requires coordinated state checks
  async executeQuery(
    sql: string,
    requiredExtensions: string[],
  ): Promise<SqlResult[]> {
    // Log memory usage before getting instance
    const memoryBefore = process.memoryUsage()
    console.info('[PGlite] Before getting instance:', {
      rss: `${Math.round(memoryBefore.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryBefore.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryBefore.external / 1024 / 1024)} MB`,
    })

    const { db, supportedExtensions } =
      await this.getOrCreateInstance(requiredExtensions)

    // Get instance index for state tracking
    const instanceIndex =
      (PGliteInstanceManager.currentIndex -
        1 +
        PGliteInstanceManager.POOL_SIZE) %
      PGliteInstanceManager.POOL_SIZE

    // Log memory usage after getting instance
    const memoryAfter = process.memoryUsage()
    console.info('[PGlite] After getting instance:', {
      rss: `${Math.round(memoryAfter.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryAfter.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryAfter.external / 1024 / 1024)} MB`,
      rssDelta: `+${Math.round((memoryAfter.rss - memoryBefore.rss) / 1024 / 1024)} MB`,
    })

    // Always filter CREATE EXTENSION statements based on supported extensions
    const filteredSql = filterExtensionDDL(sql, supportedExtensions)

    // Check if this is test SQL (has DDL/DML structure)
    const isTestSql =
      filteredSql.includes('-- DDL Statements') ||
      filteredSql.includes('-- Test Case:')

    try {
      if (isTestSql) {
        // Split DDL and DML for test SQL
        const { ddl, dml } = this.splitDDLandDML(filteredSql)
        const ddlHash = ddl ? this.generateDDLHash(ddl) : ''

        // Check if DDL needs to be executed for this instance
        const currentDDLHash =
          PGliteInstanceManager.instanceDDLHash.get(instanceIndex)
        if (ddl && currentDDLHash !== ddlHash) {
          console.info(
            `[PGlite] Instance ${instanceIndex}: Executing new DDL (hash: ${ddlHash})`,
          )

          // If there's an existing transaction, rollback first
          if (PGliteInstanceManager.instanceHasTransaction.get(instanceIndex)) {
            await db.query('ROLLBACK')
            PGliteInstanceManager.instanceHasTransaction.set(
              instanceIndex,
              false,
            )
          }

          // Execute DDL
          await this.executeSql(ddl, db)
          PGliteInstanceManager.instanceDDLHash.set(instanceIndex, ddlHash)

          // Start new transaction with savepoint after DDL
          await db.query('BEGIN')
          await db.query('SAVEPOINT clean_state')
          PGliteInstanceManager.instanceHasTransaction.set(instanceIndex, true)
          console.info(
            `[PGlite] Instance ${instanceIndex}: Transaction started with savepoint`,
          )
        } else if (ddl && currentDDLHash === ddlHash) {
          console.info(
            `[PGlite] Instance ${instanceIndex}: Skipping DDL (already executed)`,
          )
        }

        // Execute DML if present
        if (dml) {
          // Ensure transaction exists for DML execution
          if (
            !PGliteInstanceManager.instanceHasTransaction.get(instanceIndex)
          ) {
            await db.query('BEGIN')
            await db.query('SAVEPOINT clean_state')
            PGliteInstanceManager.instanceHasTransaction.set(
              instanceIndex,
              true,
            )
            console.info(
              `[PGlite] Instance ${instanceIndex}: Transaction started with savepoint for DML`,
            )
          }

          console.info(
            `[PGlite] Instance ${instanceIndex}: Executing DML with savepoint`,
          )
          const results = await this.executeSql(dml, db)

          // Rollback to savepoint to keep clean state
          await db.query('ROLLBACK TO SAVEPOINT clean_state')
          console.info(
            `[PGlite] Instance ${instanceIndex}: Rolled back to savepoint`,
          )

          return results
        }

        // If only DDL (no DML), return empty results
        return []
      }
      // For regular SQL (non-test), execute directly without transaction management
      console.info(
        `[PGlite] Instance ${instanceIndex}: Executing regular SQL (non-test)`,
      )
      return await this.executeSql(filteredSql, db)
    } catch (error) {
      // On error, try to rollback to savepoint
      if (PGliteInstanceManager.instanceHasTransaction.get(instanceIndex)) {
        try {
          await db.query('ROLLBACK TO SAVEPOINT clean_state')
          console.info(
            `[PGlite] Instance ${instanceIndex}: Rolled back to savepoint due to error`,
          )
        } catch {
          // If savepoint rollback fails, rollback entire transaction
          await db.query('ROLLBACK')
          PGliteInstanceManager.instanceHasTransaction.set(instanceIndex, false)
          console.info(
            `[PGlite] Instance ${instanceIndex}: Full transaction rollback`,
          )
        }
      }
      throw error
    } finally {
      // Log current memory state
      const memoryFinal = process.memoryUsage()
      console.info('[PGlite] After execution:', {
        rss: `${Math.round(memoryFinal.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryFinal.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryFinal.external / 1024 / 1024)} MB`,
        rssDelta: `${Math.round((memoryFinal.rss - memoryAfter.rss) / 1024 / 1024)} MB from after getting instance`,
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
