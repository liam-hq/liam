import type { RunnableConfig } from '@langchain/core/runnables'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { WORKFLOW_RETRY_CONFIG } from '../constants'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'

const NODE_NAME = 'validateSchemaNode'

// Error patterns that might benefit from retry
const RETRYABLE_ERROR_PATTERNS = [
  'constraint violation',
  'foreign key',
  'duplicate key',
  'deadlock',
  'lock timeout',
]

function isRetryableError(errorMessage: string): boolean {
  const lowerError = errorMessage.toLowerCase()
  return RETRYABLE_ERROR_PATTERNS.some((pattern) =>
    lowerError.includes(pattern),
  )
}
/**
 * Validate Schema Node - Combined DDL/DML Execution & Validation
 * Executes DDL (if needed) and then DML to validate schema with test data
 */
export async function validateSchemaNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
    }
  }

  let updatedState = state

  // Execute DDL first if available and not already executed
  if (state.ddlStatements && !state.ddlExecutionFailed) {
    const ddlResults: SqlResult[] = await executeQuery(
      state.designSessionId,
      state.ddlStatements,
    )

    const ddlHasErrors = ddlResults.some((result: SqlResult) => !result.success)

    if (ddlHasErrors) {
      const errorMessages = ddlResults
        .filter((result: SqlResult) => !result.success)
        .map(
          (result: SqlResult) =>
            `SQL: ${result.sql}, Error: ${JSON.stringify(result.result)}`,
        )
        .join('; ')

      // Continue to try DML even if DDL fails
      updatedState = {
        ...updatedState,
        ddlExecutionFailed: true,
        ddlExecutionFailureReason: errorMessages,
      }
    }
  }

  // Check if DML statements are available
  if (!updatedState.dmlStatements || !updatedState.dmlStatements.trim()) {
    return updatedState
  }
  // Execute DML statements
  const results: SqlResult[] = await executeQuery(
    updatedState.designSessionId,
    updatedState.dmlStatements,
  )

  // Check for execution errors
  const hasErrors = results.some((result: SqlResult) => !result.success)

  if (hasErrors) {
    const errorMessages = results
      .filter((result: SqlResult) => !result.success)
      .map(
        (result: SqlResult) =>
          `SQL: ${result.sql}, Error: ${JSON.stringify(result.result)}`,
      )
      .join('; ')

    configurableResult.value.logger.error(`[${NODE_NAME}] DML execution failed: ${errorMessages}`)

    // Check if errors are retryable
    const hasRetryableError = isRetryableError(errorMessages)
    const currentRetryCount = updatedState.retryCount['dmlExecutionRetry'] || 0

    if (
      hasRetryableError &&
      currentRetryCount < WORKFLOW_RETRY_CONFIG.MAX_DML_EXECUTION_RETRIES
    ) {
      configurableResult.value.logger.log(
        `[${NODE_NAME}] DML execution failed with retryable error, scheduling retry`,
      )
      configurableResult.value.logger.log(`[${NODE_NAME}] Completed with retry scheduled`)

      return {
        ...updatedState,
        dmlExecutionErrors: errorMessages,
        shouldRetryDmlExecution: true,
        dmlRetryReason: errorMessages,
        retryCount: {
          ...updatedState.retryCount,
          dmlExecutionRetry: currentRetryCount + 1,
        },
      }
    }

    // Non-retryable error or max retries exceeded
    configurableResult.value.logger.log(`[${NODE_NAME}] Completed with errors`)
    return {
      ...updatedState,
      dmlExecutionErrors: errorMessages,
    }
  }

  return {
    ...updatedState,
    dmlExecutionSuccessful: true,
  }
}
