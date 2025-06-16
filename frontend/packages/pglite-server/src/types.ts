export interface SqlResult {
  sql: string
  result: unknown
  success: boolean
  id: string
  metadata: {
    executionTime: number
    timestamp: string
    affectedRows?: number | undefined
  }
}
