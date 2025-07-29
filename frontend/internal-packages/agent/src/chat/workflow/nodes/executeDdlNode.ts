import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { postgresqlSchemaDeparser } from '@liam-hq/db-structure'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { WORKFLOW_RETRY_CONFIG } from '../constants.ts'
import { getConfigurable } from '../shared/getConfigurable.ts'
import type { WorkflowState } from '../types.ts'
import { logQueryResults } from '../utils/queryResultLogger.ts'
import { logAssistantMessage } from '../utils/timelineLogger.ts'

/**
 * Execute DDL Node - Generates DDL from schema and executes it
 * Generates DDL mechanically without LLM and then executes
 */
export async function executeDdlNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const assistantRole: Database['public']['Enums']['assistant_role_enum'] = 'db'
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(
    state,
    repositories,
    'Building your database with the optimized structure...',
    assistantRole,
  )

  // Generate DDL from schema data
  const result = postgresqlSchemaDeparser(state.schemaData)

  if (result.errors.length > 0) {
    await logAssistantMessage(
      state,
      repositories,
      'Unable to generate database structure. There may be an issue with the schema design...',
      assistantRole,
    )

    return {
      ...state,
      ddlStatements: 'DDL generation failed due to an unexpected error.',
    }
  }

  const ddlStatements = result.value

  if (!ddlStatements || !ddlStatements.trim()) {
    await logAssistantMessage(
      state,
      repositories,
      'No database structure to build. The schema design appears to be empty...',
      assistantRole,
    )

    return {
      ...state,
      ddlStatements,
    }
  }

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

    // Log query results to timeline
    const resultSummary =
      errorCount === 0
        ? `All ${successCount} SQL statements executed successfully`
        : `${successCount} succeeded, ${errorCount} failed`

    await logQueryResults(
      state,
      repositories,
      queryResult.queryId,
      results,
      resultSummary,
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
      'Database creation encountered issues. Attempting to fix the problems...',
      assistantRole,
    )

    // Check if this is the first failure or if we've already retried
    const currentRetryCount = state.retryCount['ddlExecutionRetry'] || 0

    if (currentRetryCount < WORKFLOW_RETRY_CONFIG.MAX_DDL_EXECUTION_RETRIES) {
      // Set up retry with designSchemaNode
      await logAssistantMessage(
        state,
        repositories,
        'Redesigning schema to fix errors...',
        assistantRole,
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
      assistantRole,
    )

    return {
      ...state,
      ddlExecutionFailed: true,
      ddlExecutionFailureReason: errorMessages,
    }
  }

  return {
    ...state,
    ddlStatements,
  }
}
