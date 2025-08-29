import { PGliteInstanceManager } from './PGliteInstanceManager'
import type { SqlResult } from './types'

const manager = new PGliteInstanceManager()

export async function executeQuery(
  sql: string,
  options?: { extensions?: string[] },
): Promise<SqlResult[]> {
  return await manager.executeQuery(sql, options)
}

export { manager as pgliteManager }
