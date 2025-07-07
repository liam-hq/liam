import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

const NODE_NAME = 'executeDdlNode'

/**
 * Execute DDL Node - Agent executes DDL
 * Performed by agent
 */
export async function executeDdlNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  // Update progress message if available
  if (state.progressTimelineItemId) {
    await state.repositories.schema.updateTimelineItem(
      state.progressTimelineItemId,
      {
        content: 'Processing: executeDDL',
        progress: getWorkflowNodeProgress('executeDDL'),
      },
    )
  }

  if (!state.ddlStatements || !state.ddlStatements.trim()) {
    state.logger.log(`[${NODE_NAME}] No DDL statements to execute`)
    state.logger.log(`[${NODE_NAME}] Completed`)
    return {
      ...state,
    }
  }

  const results: SqlResult[] = await executeQuery(
    state.designSessionId,
    state.ddlStatements,
  )

  const hasErrors = results.some((result: SqlResult) => !result.success)

  if (hasErrors) {
    const errorMessages = results
      .filter((result: SqlResult) => !result.success)
      .map(
        (result: SqlResult) =>
          `SQL: ${result.sql}, Error: ${JSON.stringify(result.result)}`,
      )
      .join('; ')

    state.logger.log(`[${NODE_NAME}] DDL execution failed: ${errorMessages}`)

    // Check if this is the first failure or if we've already retried
    const currentRetryCount = state.retryCount['ddlExecutionRetry'] || 0

    if (currentRetryCount === 0) {
      // First failure - set up retry with designSchemaNode
      state.logger.log(`[${NODE_NAME}] Scheduling retry via designSchemaNode`)
      state.logger.log(`[${NODE_NAME}] Completed`)
      return {
        ...state,
        shouldRetryWithDesignSchema: true,
        ddlExecutionFailureReason: errorMessages,
        retryCount: {
          ...state.retryCount,
          ddlExecutionRetry: 1,
        },
      }
    }

    // Already retried - mark as permanently failed
    state.logger.log(
      `[${NODE_NAME}] DDL execution failed after retry, marking as failed`,
    )
    state.logger.log(`[${NODE_NAME}] Completed`)
    return {
      ...state,
      ddlExecutionFailed: true,
      ddlExecutionFailureReason: errorMessages,
    }
  }

  state.logger.log(`[${NODE_NAME}] DDL executed successfully`)
  state.logger.log(`[${NODE_NAME}] Completed`)

  return {
    ...state,
  }
}
