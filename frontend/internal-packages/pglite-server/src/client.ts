import { PGliteInstanceManager } from './PGliteInstanceManager'
import type { SqlResult } from './types'

const manager = new PGliteInstanceManager()

export async function executeQuery(
  sql: string,
  requiredExtensions: string[] = [],
  signal?: AbortSignal,
): Promise<SqlResult[]> {
  return await manager.executeQuery(sql, requiredExtensions, signal)
}

export { manager as pgliteManager }
