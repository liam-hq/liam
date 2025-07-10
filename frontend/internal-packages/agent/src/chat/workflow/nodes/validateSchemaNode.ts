import { postgresqlSchemaDeparser } from '@liam-hq/db-structure'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { ResultAsync } from 'neverthrow'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

const NODE_NAME = 'validateSchemaNode'

/**
 * Validate Schema Node - Combined DDL & DML Execution & Validation
 * Generates DDL from schema and executes it together with DML statements
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

  // Generate DDL from schema data
  const ddlResult = postgresqlSchemaDeparser(state.schemaData)

  if (ddlResult.errors.length > 0) {
    const errorMessages = ddlResult.errors.map((e) => e.message).join('; ')
    const error = new Error(
      `[${NODE_NAME}] DDL generation failed: ${errorMessages}`,
    )
    state.logger.error(error.message)
    state.logger.log(`[${NODE_NAME}] Completed with errors`)
    return {
      ...state,
      error,
    }
  }

  const ddlStatements = ddlResult.value
  const dmlStatements = state.dmlStatements || ''

  // Check if we have any statements to execute
  if (!ddlStatements.trim() && !dmlStatements.trim()) {
    state.logger.log(`[${NODE_NAME}] No DDL or DML statements to execute`)
    state.logger.log(`[${NODE_NAME}] Completed`)
    return {
      ...state,
      ddlStatements,
    }
  }

  // Combine DDL and DML statements
  const combinedStatements = [ddlStatements, dmlStatements]
    .filter((stmt) => stmt.trim())
    .join('\n\n')

  const queryResult = await ResultAsync.fromPromise(
    executeQuery(state.designSessionId, combinedStatements),
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
    `[${NODE_NAME}] Successfully executed ${successfulResults.length} DDL/DML statements`,
  )
  state.logger.log(`[${NODE_NAME}] Schema validation passed`)
  state.logger.log(`[${NODE_NAME}] Completed`)

  return {
    ...state,
    ddlStatements,
    error: undefined,
  }
}
