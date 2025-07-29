import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { ResultAsync } from 'neverthrow'
import type { Repositories } from '../../../repositories/index.ts'
import type { WorkflowState } from '../types.ts'

/**
 * Helper function to create query_result timeline items
 * Logs SQL query execution results to the timeline
 */
export async function logQueryResults(
  state: WorkflowState,
  repositories: Repositories,
  queryResultId: string,
  _results: SqlResult[],
  summary: string,
): Promise<void> {
  const result = await ResultAsync.fromPromise(
    repositories.schema.createTimelineItem({
      designSessionId: state.designSessionId,
      content: summary,
      type: 'query_result',
      queryResultId,
    }),
    (error) => error,
  )

  result.mapErr((error) => {
    // Log error but don't throw to avoid breaking workflow
    console.error('Failed to create query result timeline item:', error)
  })
}
