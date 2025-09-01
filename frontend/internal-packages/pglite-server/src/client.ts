import { PGliteInstanceManager } from './PGliteInstanceManager'
import type { SqlResult } from './types'

const manager = new PGliteInstanceManager()

export async function executeQuery(
  sql: string,
  requiredExtensions: string[] = [],
): Promise<SqlResult[]> {
  return await manager.executeQuery(sql, requiredExtensions)
}

export { manager as pgliteManager }
