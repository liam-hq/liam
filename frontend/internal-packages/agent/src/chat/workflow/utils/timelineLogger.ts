import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { ResultAsync } from 'neverthrow'
import type { Repositories } from '../../../repositories'
import type { WorkflowState } from '../types'

/**
 * Helper function to create assistant_log timeline items
 * Reduces code duplication across workflow nodes
 */
export async function logAssistantMessage(
  state: WorkflowState,
  repositories: Repositories,
  content: string,
): Promise<void> {
  const result = await ResultAsync.fromPromise(
    repositories.schema.createTimelineItem({
      designSessionId: state.designSessionId,
      content,
      type: 'assistant_log',
    }),
    (error) => error,
  )

  result.mapErr((error) => {
    // Log error but don't throw to avoid breaking workflow
    console.error('Failed to create timeline item:', error)
  })
}

export async function logDdlExecutionResults(
  state: WorkflowState,
  repositories: Repositories,
  results: SqlResult[],
): Promise<void> {
  const successCount = results.filter((r) => r.success).length
  const totalCount = results.length
  const content = `DDL Execution Results: ${successCount}/${totalCount} statements executed successfully`

  const result = await ResultAsync.fromPromise(
    repositories.schema.createTimelineItem({
      designSessionId: state.designSessionId,
      content,
      type: 'ddl_execution',
      metadata: { sqlResults: results },
    }),
    (error) => error,
  )

  result.mapErr((error) => {
    console.error('Failed to create DDL execution timeline item:', error)
  })
}

export async function logDmlExecutionResults(
  state: WorkflowState,
  repositories: Repositories,
  results: SqlResult[],
): Promise<void> {
  const successCount = results.filter((r) => r.success).length
  const totalCount = results.length
  const content = `DML Execution Results: ${successCount}/${totalCount} statements executed successfully`

  const result = await ResultAsync.fromPromise(
    repositories.schema.createTimelineItem({
      designSessionId: state.designSessionId,
      content,
      type: 'dml_execution',
      metadata: { sqlResults: results },
    }),
    (error) => error,
  )

  result.mapErr((error) => {
    console.error('Failed to create DML execution timeline item:', error)
  })
}
