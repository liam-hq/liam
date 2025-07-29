import { PGliteInstanceManager } from './PGliteInstanceManager.ts'
import type { SqlResult } from './types.ts'

const manager = new PGliteInstanceManager()

export async function executeQuery(
  sessionId: string,
  sql: string,
): Promise<SqlResult[]> {
  return await manager.executeQuery(sessionId, sql)
}

export { manager as pgliteManager }
