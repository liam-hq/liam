import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { postgresqlSchemaDeparser } from '@liam-hq/db-structure'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { WORKFLOW_RETRY_CONFIG } from '../constants.ts'
import { getConfigurable } from '../shared/getConfigurable.ts'
import type { WorkflowState } from '../types.ts'
import { logAssistantMessage } from '../utils/timelineLogger.ts'

/**
 * Execute DDL Node - Generates DDL from schema and executes it
 * Generates DDL mechanically without LLM and then executes
 */
export async function executeDdlNode(
  state: WorkflowState,
  config: RunnableConfig,
  assistantRole: Database['public']['Enums']['assistant_role_enum'],
): Promise<WorkflowState> {
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

  // Generate DDL from schema data
  const result = postgresqlSchemaDeparser(state.schemaData)

  if (result.errors.length > 0) {
    await logAssistantMessage(
      state,
      repositories,
      'Error occurred during DDL generation',
      assistantRole,
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
      ddlStatements,
    }
  }

  await logAssistantMessage(
    state,
    repositories,
    'Executing DDL statements...',
    assistantRole,
  )

  // Skip actual DDL execution in offline mode
  let results: SqlResult[]
  if (process.env.LIAM_OFFLINE_MODE === 'true') {
    // Create mock results for offline mode
    const statements = ddlStatements
      .split(';')
      .filter((s) => s.trim().length > 0)
    results = statements.map((statement) => ({
      success: true,
      statement: statement.trim(),
      result: {
        rows: [],
        fields: [],
        affectedRows: 0,
      },
      executionTime: 0,
    }))
  } else {
    results = await executeQuery(state.designSessionId, ddlStatements)
  }

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

  await logAssistantMessage(
    state,
    repositories,
    'Database created successfully',
    assistantRole,
  )

  return {
    ...state,
    ddlStatements,
  }
}
