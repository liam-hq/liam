import type { RunnableConfig } from '@langchain/core/runnables'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'

/**
 * Validate Schema Node - Combined DDL/DML Execution & Validation
 * Executes DDL and DML together in a single query to validate schema with test data
 * This node also saves execution results to the database for audit purposes
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
  const { repositories } = configurableResult.value

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

  const queryResult = await repositories.schema.createValidationQuery({
    designSessionId: state.designSessionId,
    queryString: combinedStatements,
  })

  if (queryResult.success) {
    await repositories.schema.createValidationResults({
      validationQueryId: queryResult.queryId,
      results,
    })

    const successCount = results.filter((r) => r.success).length
    const errorCount = results.length - successCount
    await logAssistantMessage(
      state,
      repositories,
      `Schema Validation Complete: ${successCount} successful, ${errorCount} failed queries`,
    )
  }

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
