import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { ResultAsync } from 'neverthrow'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

const NODE_NAME = 'validateSchemaNode'

/**
 * Validate Schema Node - DML Execution & Validation
 * Performed by qaAgent
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

  if (!state.dmlStatements || !state.dmlStatements.trim()) {
    state.logger.log(`[${NODE_NAME}] No DML statements to execute`)
    state.logger.log(`[${NODE_NAME}] Completed`)
    return {
      ...state,
    }
  }

  const queryResult = await ResultAsync.fromPromise(
    executeQuery(state.designSessionId, state.dmlStatements),
    (error) => {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return new Error(`DML execution failed: ${errorMessage}`)
    },
  )

  if (queryResult.isErr()) {
    const validationErr = new Error(
      `[${NODE_NAME}] ${queryResult.error.message}`,
    )
    state.logger.error(validationErr.message)
    state.logger.log(`[${NODE_NAME}] Completed with errors`)

    return {
      ...state,
      error: validationErr,
    }
  }

  const results = queryResult.value
  const hasErrors = results.some((result: SqlResult) => !result.success)

  if (hasErrors) {
    const errorMessages = results
      .filter((result: SqlResult) => !result.success)
      .map(
        (result: SqlResult) =>
          `SQL: ${result.sql}, Error: ${JSON.stringify(result.result)}`,
      )
      .join('; ')

    const validationError = `DML validation failed: ${errorMessages}`
    const error = new Error(`[${NODE_NAME}] ${validationError}`)
    state.logger.error(error.message)
    state.logger.log(`[${NODE_NAME}] Completed with errors`)

    return {
      ...state,
      error,
    }
  }

  const successfulResults = results.filter(
    (result: SqlResult) => result.success,
  )
  state.logger.log(
    `[${NODE_NAME}] Successfully executed ${successfulResults.length} DML statements`,
  )
  state.logger.log(`[${NODE_NAME}] Schema validation passed`)
  state.logger.log(`[${NODE_NAME}] Completed`)

  return {
    ...state,
    error: undefined,
  }
}
