export interface SqlResult {
  sql: string
  result: unknown
  success: boolean
  id: string
  metadata: {
    executionTime: number
    timestamp: string
    affectedRows?: number
  }
}

export async function executeQuery(
  sessionId: string,
  sql: string,
  type: 'DDL' | 'DML',
): Promise<SqlResult[]> {
  const response = await fetch('/api/pglite/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      sql,
      type,
    }),
  })

  if (!response.ok) {
    throw new Error(`Query failed: ${response.statusText}`)
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Query execution failed')
  }

  return data.results
}

export const query = executeQuery
