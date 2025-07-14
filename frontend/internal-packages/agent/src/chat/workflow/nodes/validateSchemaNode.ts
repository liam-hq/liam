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
 * Executes DDL and DML together in a single query to validate schema with test data
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

  // Check if we have any statements to execute
  const hasDdl = state.ddlStatements?.trim()
  const hasDml = state.dmlStatements?.trim()

  if (!hasDdl && !hasDml) {
    return state
  }

  // Combine DDL and DML statements
  const combinedStatements = [
    hasDdl ? state.ddlStatements : '',
    hasDml ? state.dmlStatements : '',
  ]
    .filter(Boolean)
    .join('\n')

  // Execute combined statements
  const results: SqlResult[] = await executeQuery(
    state.designSessionId,
    combinedStatements,
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

    configurableResult.value.logger.error(
      `[${NODE_NAME}] Execution failed: ${errorMessages}`,
    )

    // Check if errors are retryable
    const hasRetryableError = isRetryableError(errorMessages)
    const currentRetryCount = state.retryCount?.['dmlExecutionRetry'] || 0

    if (
      hasRetryableError &&
      currentRetryCount < WORKFLOW_RETRY_CONFIG.MAX_DML_EXECUTION_RETRIES
    ) {
      configurableResult.value.logger.log(
        `[${NODE_NAME}] Execution failed with retryable error, scheduling retry`,
      )
      configurableResult.value.logger.log(
        `[${NODE_NAME}] Completed with retry scheduled`,
      )

      return {
        ...state,
        dmlExecutionErrors: errorMessages,
        shouldRetryDmlExecution: true,
        dmlRetryReason: errorMessages,
        retryCount: {
          ...state.retryCount,
          dmlExecutionRetry: currentRetryCount + 1,
        },
      }
    }

    // Non-retryable error or max retries exceeded
    configurableResult.value.logger.log(`[${NODE_NAME}] Completed with errors`)
    return {
      ...state,
      dmlExecutionErrors: errorMessages,
    }
  }

  return {
    ...state,
    dmlExecutionSuccessful: true,
  }
}
