import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { WORKFLOW_RETRY_CONFIG } from '../constants'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { executeDdl } from '../../../utils/ddlExecutor'
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

  // Execute DDL using the common function
  const ddlResult = await executeDdl(state.schemaData, {
    designSessionId: state.designSessionId,
    repositories,
    logMessage: async (message: string) => {
      await logAssistantMessage(state, repositories, message, assistantRole)
    },
  })

  const hasErrors = !ddlResult.success

  if (hasErrors) {
    const errorMessages = ddlResult.errorMessages || 'Unknown error occurred'

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
    ddlStatements: ddlResult.ddlStatements,
  }
}
