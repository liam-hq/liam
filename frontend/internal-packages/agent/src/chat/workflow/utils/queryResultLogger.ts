import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { ResultAsync } from 'neverthrow'
import type { Repositories } from '../../../repositories'
import type { WorkflowState } from '../types'

/**
 * Helper function to create query_result timeline items
 * Logs SQL query execution results to the timeline
 */
export async function logQueryResults(
  state: WorkflowState,
  repositories: Repositories,
  queryResultId: string,
  results: SqlResult[],
  summary: string,
): Promise<void> {
  // Convert results to Json-compatible format by serializing result field
  const jsonResults = results.map((r) => ({
    id: r.id,
    sql: r.sql,
    success: r.success,
    result: JSON.stringify(r.result),
    metadata: {
      executionTime: r.metadata.executionTime,
      timestamp: r.metadata.timestamp,
      affectedRows: r.metadata.affectedRows ?? null,
    },
  }))

  const result = await ResultAsync.fromPromise(
    repositories.schema.createTimelineItem({
      designSessionId: state.designSessionId,
      content: summary,
      type: 'query_result',
      queryResultId,
      queryResults: jsonResults,
    }),
    (error) => error,
  )

  result.mapErr((error) => {
    // Log error but don't throw to avoid breaking workflow
    console.error('Failed to create query result timeline item:', error)
  })
}
