import { PGliteInstanceManager } from './PGliteInstanceManager.js'
import type { SqlResult } from './types.js'

const manager = new PGliteInstanceManager()

export async function executeQuery(
  sessionId: string,
  sql: string,
): Promise<SqlResult[]> {
  return await manager.executeQuery(sessionId, sql)
}

export { manager as pgliteManager }
