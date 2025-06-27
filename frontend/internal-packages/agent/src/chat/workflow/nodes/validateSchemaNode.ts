import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
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

  if (state.onNodeProgress) {
    await state.onNodeProgress(
      'validateSchema',
      getWorkflowNodeProgress('validateSchema'),
    )
  }

  if (!state.dmlStatements || !state.dmlStatements.trim()) {
    state.logger.log(`[${NODE_NAME}] No DML statements to execute`)
    state.logger.log(`[${NODE_NAME}] Completed`)
    return {
      ...state,
    }
  }

  try {
    const results: SqlResult[] = await executeQuery(
      state.designSessionId,
      state.dmlStatements,
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

      const validationError = `DML validation failed: ${errorMessages}`
      state.logger.error(`[${NODE_NAME}] ${validationError}`)
      state.logger.log(`[${NODE_NAME}] Completed with errors`)

      return {
        ...state,
        error: validationError,
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const validationError = `DML execution failed: ${errorMessage}`
    state.logger.error(`[${NODE_NAME}] ${validationError}`)
    state.logger.log(`[${NODE_NAME}] Completed with errors`)

    return {
      ...state,
      error: validationError,
    }
  }
}
