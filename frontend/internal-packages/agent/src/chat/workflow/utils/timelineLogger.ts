import { ResultAsync } from 'neverthrow'
import type { Repositories } from '../../../repositories'
import type {
  DDLExecutionResult,
  DMLExecutionResult,
  WorkflowState,
} from '../types'

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
    console.error('Failed to create timeline item:', error)
  })
}

/**
 * Helper function to create DDL execution result timeline items
 */
export async function logDDLExecutionResult(
  state: WorkflowState,
  repositories: Repositories,
  result: DDLExecutionResult,
): Promise<void> {
  const timelineResult = await ResultAsync.fromPromise(
    repositories.schema.createTimelineItem({
      designSessionId: state.designSessionId,
      content: JSON.stringify(result),
      type: 'ddl_execution_result',
    }),
    (error) => error,
  )

  timelineResult.mapErr((error) => {
    console.error('Failed to create DDL execution result timeline item:', error)
  })
}

/**
 * Helper function to create DML execution result timeline items
 */
export async function logDMLExecutionResult(
  state: WorkflowState,
  repositories: Repositories,
  result: DMLExecutionResult,
): Promise<void> {
  const timelineResult = await ResultAsync.fromPromise(
    repositories.schema.createTimelineItem({
      designSessionId: state.designSessionId,
      content: JSON.stringify(result),
      type: 'dml_execution_result',
    }),
    (error) => error,
  )

  timelineResult.mapErr((error) => {
    console.error('Failed to create DML execution result timeline item:', error)
  })
}
