import type { RunnableConfig } from '@langchain/core/runnables'
import { postgresqlSchemaDeparser } from '@liam-hq/db-structure'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { WORKFLOW_RETRY_CONFIG } from '../constants'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'

/**
 * Execute DDL Node - Generates DDL from schema and executes it
 * Generates DDL mechanically without LLM and then executes
 */
export async function executeDdlNode(
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

  await logAssistantMessage(state, repositories, 'Creating database...')

  // Generate DDL from schema data
  const result = postgresqlSchemaDeparser(state.schemaData)

  if (result.errors.length > 0) {
    await logAssistantMessage(
      state,
      repositories,
      'Error occurred during DDL generation',
    )

    return {
      ...state,
      ddlStatements: 'DDL generation failed due to an unexpected error.',
    }
  }

  const ddlStatements = result.value

  const tableCount = Object.keys(state.schemaData.tables).length

  await logAssistantMessage(
    state,
    repositories,
    `Generated DDL statements (${tableCount} tables)`,
  )

  if (!ddlStatements || !ddlStatements.trim()) {
    await logAssistantMessage(
      state,
      repositories,
      'No DDL statements to execute',
    )

    return {
      ...state,
      ddlStatements,
    }
  }

  await logAssistantMessage(state, repositories, 'Executing DDL statements...')

  const results: SqlResult[] = await executeQuery(
    state.designSessionId,
    ddlStatements,
  )

  const queryResult = await repositories.schema.createValidationQuery({
    designSessionId: state.designSessionId,
    queryString: ddlStatements,
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
      `DDL Execution Complete: ${successCount} successful, ${errorCount} failed queries`,
    )
  }

  const hasErrors = results.some((result: SqlResult) => !result.success)

  if (hasErrors) {
    const errorMessages = results
      .filter((result: SqlResult) => !result.success)
      .map(
        (result: SqlResult) =>
          `SQL: ${result.sql}, Error: ${JSON.stringify(result.result)}`,
      )
      .join('; ')

    await logAssistantMessage(
      state,
      repositories,
      'Error occurred during DDL execution',
    )

    // Check if this is the first failure or if we've already retried
    const currentRetryCount = state.retryCount['ddlExecutionRetry'] || 0

    if (currentRetryCount < WORKFLOW_RETRY_CONFIG.MAX_DDL_EXECUTION_RETRIES) {
      // Set up retry with designSchemaNode
      await logAssistantMessage(
        state,
        repositories,
        'Redesigning schema to fix errors...',
      )

      return {
        ...state,
        shouldRetryWithDesignSchema: true,
        ddlExecutionFailureReason: errorMessages,
        retryCount: {
          ...state.retryCount,
          ddlExecutionRetry: currentRetryCount + 1,
        },
      }
    }

    // Already retried - mark as permanently failed
    await logAssistantMessage(
      state,
      repositories,
      'Unable to resolve DDL execution errors',
    )

    return {
      ...state,
      ddlExecutionFailed: true,
      ddlExecutionFailureReason: errorMessages,
    }
  }

  await logAssistantMessage(
    state,
    repositories,
    'Database created successfully',
  )

  return {
    ...state,
    ddlStatements,
  }
}
