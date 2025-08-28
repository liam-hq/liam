import { PGliteInstanceManager } from './PGliteInstanceManager'
import type { SqlResult } from './types'

const manager = new PGliteInstanceManager()

export async function executeQuery(sql: string): Promise<SqlResult[]> {
  return await manager.executeQuery(sql)
}

export { manager as pgliteManager }
