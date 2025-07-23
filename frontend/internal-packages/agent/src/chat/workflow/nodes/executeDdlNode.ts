import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { postgresqlSchemaDeparser } from '@liam-hq/db-structure'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { WORKFLOW_RETRY_CONFIG } from '../constants'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logQueryResults } from '../utils/queryResultLogger'
import { logAssistantMessage } from '../utils/timelineLogger'

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
    'Creating database...',
    assistantRole,
  )

  // Fetch the latest schema from database to ensure we have the most current data
  const schemaResult = await repositories.schema.getSchema(
    state.designSessionId,
  )
  if (schemaResult.error || !schemaResult.data) {
    await logAssistantMessage(
      state,
      repositories,
      'Failed to fetch current schema from database',
      assistantRole,
    )
    return {
      ...state,
      error: new Error(schemaResult.error?.message || 'Failed to fetch schema'),
    }
  }

  const currentSchemaData = schemaResult.data
  const currentSchema = currentSchemaData.schema

  // Generate DDL from the latest schema data
  const result = postgresqlSchemaDeparser(currentSchema)

  if (result.errors.length > 0) {
    await logAssistantMessage(
      state,
      repositories,
      'Error occurred during DDL generation',
      assistantRole,
    )

    return {
      ...state,
      schemaData: currentSchema,
      ddlStatements: 'DDL generation failed due to an unexpected error.',
    }
  }

  const ddlStatements = result.value

  const tableCount = Object.keys(currentSchema.tables).length

  await logAssistantMessage(
    state,
    repositories,
    `Generated DDL statements (${tableCount} tables)`,
    assistantRole,
  )

  if (!ddlStatements || !ddlStatements.trim()) {
    await logAssistantMessage(
      state,
      repositories,
      'No DDL statements to execute',
      assistantRole,
    )

    return {
      ...state,
      schemaData: currentSchema,
      ddlStatements,
    }
  }

  await logAssistantMessage(
    state,
    repositories,
    'Executing DDL statements...',
    assistantRole,
  )

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

    await logAssistantMessage(
      state,
      repositories,
      `DDL Execution Complete: ${successCount} successful, ${errorCount} failed queries`,
      assistantRole,
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
        schemaData: currentSchema,
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
      schemaData: currentSchema,
      ddlExecutionFailed: true,
      ddlExecutionFailureReason: errorMessages,
    }
  }

  await logAssistantMessage(
    state,
    repositories,
    'Database created successfully',
    assistantRole,
  )

  return {
    ...state,
    schemaData: currentSchema, // Update state with the latest schema
    ddlStatements,
  }
}
