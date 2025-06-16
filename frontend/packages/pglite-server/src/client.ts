import { PGliteInstanceManager } from './PGliteInstanceManager'
import type { SqlResult } from './types'

const manager = new PGliteInstanceManager()

export async function executeQuery(
  sessionId: string,
  sql: string,
): Promise<SqlResult[]> {
  return await manager.executeQuery(sessionId, sql)
}

export { manager as pgliteManager }
