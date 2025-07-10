import { postgresqlSchemaDeparser } from '@liam-hq/db-structure'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { WORKFLOW_RETRY_CONFIG } from '../constants'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'

const NODE_NAME = 'executeDdlNode'

/**
 * Execute DDL Node - Generates DDL from schema and executes it
 * Generates DDL mechanically without LLM and then executes
 */
export async function executeDdlNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  await logAssistantMessage(state, 'Creating database...')

  // Generate DDL from schema data
  const result = postgresqlSchemaDeparser(state.schemaData)

  if (result.errors.length > 0) {
    const errorMessages = result.errors.map((e) => e.message).join('; ')
    state.logger.log(`[${NODE_NAME}] DDL generation failed: ${errorMessages}`)

    await logAssistantMessage(state, 'Error occurred during DDL generation')

    state.logger.log(`[${NODE_NAME}] Completed`)
    return {
      ...state,
      ddlStatements: 'DDL generation failed due to an unexpected error.',
    }
  }

  const ddlStatements = result.value

  // Log detailed information about what was generated
  const tableCount = Object.keys(state.schemaData.tables).length
  const ddlLength = ddlStatements.length

  state.logger.log(
    `[${NODE_NAME}] Generated DDL for ${tableCount} tables (${ddlLength} characters)`,
  )
  state.logger.debug(`[${NODE_NAME}] Generated DDL:`, { ddlStatements })

  await logAssistantMessage(
    state,
    `Generated DDL statements (${tableCount} tables)`,
  )

  if (!ddlStatements || !ddlStatements.trim()) {
    state.logger.log(`[${NODE_NAME}] No DDL statements to execute`)

    await logAssistantMessage(state, 'No DDL statements to execute')

    state.logger.log(`[${NODE_NAME}] Completed`)
    return {
      ...state,
      ddlStatements,
    }
  }

  await logAssistantMessage(state, 'Executing DDL statements...')

  const results: SqlResult[] = await executeQuery(
    state.designSessionId,
    ddlStatements,
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

    state.logger.log(`[${NODE_NAME}] DDL execution failed: ${errorMessages}`)

    await logAssistantMessage(state, 'Error occurred during DDL execution')

    // Check if this is the first failure or if we've already retried
    const currentRetryCount = state.retryCount['ddlExecutionRetry'] || 0

    if (currentRetryCount < WORKFLOW_RETRY_CONFIG.MAX_DDL_EXECUTION_RETRIES) {
      // Set up retry with designSchemaNode
      state.logger.log(`[${NODE_NAME}] Scheduling retry via designSchemaNode`)

      await logAssistantMessage(state, 'Redesigning schema to fix errors...')

      state.logger.log(`[${NODE_NAME}] Completed`)
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
    state.logger.log(
      `[${NODE_NAME}] DDL execution failed after retry, marking as failed`,
    )

    await logAssistantMessage(state, 'Unable to resolve DDL execution errors')

    state.logger.log(`[${NODE_NAME}] Completed`)
    return {
      ...state,
      ddlExecutionFailed: true,
      ddlExecutionFailureReason: errorMessages,
    }
  }

  state.logger.log(`[${NODE_NAME}] DDL executed successfully`)

  await logAssistantMessage(state, 'Database created successfully')

  state.logger.log(`[${NODE_NAME}] Completed`)

  return {
    ...state,
    ddlStatements,
  }
}
