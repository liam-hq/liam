import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { WORKFLOW_RETRY_CONFIG } from '../constants'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
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
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  // Update progress message if available
  if (state.progressTimelineItemId) {
    await state.repositories.schema.updateTimelineItem(
      state.progressTimelineItemId,
      {
        content: 'Processing: validateSchema',
        progress: getWorkflowNodeProgress('validateSchema'),
      },
    )
  }

  let updatedState = state

  // Execute DDL first if available and not already executed
  if (state.ddlStatements && !state.ddlExecutionFailed) {
    state.logger.log(`[${NODE_NAME}] Executing DDL statements first`)

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

      state.logger.error(
        `[${NODE_NAME}] DDL execution failed: ${errorMessages}`,
      )
      // Continue to try DML even if DDL fails
      updatedState = {
        ...updatedState,
        ddlExecutionFailed: true,
        ddlExecutionFailureReason: errorMessages,
      }
    } else {
      state.logger.log(`[${NODE_NAME}] DDL executed successfully`)
    }
  }

  // Check if DML statements are available
  if (!updatedState.dmlStatements || !updatedState.dmlStatements.trim()) {
    state.logger.log(`[${NODE_NAME}] No DML statements to execute`)
    state.logger.log(`[${NODE_NAME}] Completed`)
    return updatedState
  }

  // Log DML execution intent
  const dmlLength = updatedState.dmlStatements.length
  const statementCount =
    (updatedState.dmlStatements.match(/;/g) || []).length + 1
  state.logger.log(
    `[${NODE_NAME}] Executing ${statementCount} DML statements (${dmlLength} characters)`,
  )
  state.logger.debug(`[${NODE_NAME}] DML statements:`, {
    dmlStatements: updatedState.dmlStatements,
  })

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

    state.logger.error(`[${NODE_NAME}] DML execution failed: ${errorMessages}`)

    // Check if errors are retryable
    const hasRetryableError = isRetryableError(errorMessages)
    const currentRetryCount = updatedState.retryCount['dmlExecutionRetry'] || 0

    if (
      hasRetryableError &&
      currentRetryCount < WORKFLOW_RETRY_CONFIG.MAX_DML_EXECUTION_RETRIES
    ) {
      state.logger.log(
        `[${NODE_NAME}] DML execution failed with retryable error, scheduling retry`,
      )
      state.logger.log(`[${NODE_NAME}] Completed with retry scheduled`)

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
    state.logger.log(`[${NODE_NAME}] Completed with errors`)
    return {
      ...updatedState,
      dmlExecutionErrors: errorMessages,
    }
  }

  // Log successful execution
  const successfulCount = results.filter((r) => r.success).length
  state.logger.log(
    `[${NODE_NAME}] DML executed successfully: ${successfulCount} statements`,
  )

  // Log affected rows if available
  const totalAffectedRows = results.reduce((total, result) => {
    if (result.success && result.metadata?.affectedRows) {
      return total + result.metadata.affectedRows
    }
    return total
  }, 0)

  if (totalAffectedRows > 0) {
    state.logger.info(
      `[${NODE_NAME}] Total rows affected: ${totalAffectedRows}`,
    )
  }

  state.logger.log(`[${NODE_NAME}] Completed`)

  return {
    ...updatedState,
    dmlExecutionSuccessful: true,
  }
}
