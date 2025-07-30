import { HumanMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { invokeDesignAgent } from '../../../langchain/agents/databaseSchemaBuildAgent/agent'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'
import { withTimelineItemSync } from '../utils/withTimelineItemSync'

/**
 * Design Schema Node - DB Design & DDL Execution
 * Performed by dbAgent
 */
export async function designSchemaNode(
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

  // Track retry count
  const retryCount = state.retryCount['designSchemaNode'] ?? 0

  // Check if we've exceeded max retries
  if (retryCount >= 3) {
    const maxRetryMessage =
      'Maximum retry attempts reached for database design. Please review your requirements and try again.'
    await logAssistantMessage(
      state,
      repositories,
      maxRetryMessage,
      assistantRole,
    )
    return {
      ...state,
      error: new Error(maxRetryMessage),
      retryCount: {
        ...state.retryCount,
        designSchemaNode: retryCount,
      },
    }
  }

  const schemaText = convertSchemaToText(state.schemaData)

  // Filter out AIMessages to avoid reasoning API issues
  // Only keep HumanMessages to prevent "reasoning without required following item" error
  const messages = state.messages.filter((msg) => msg._getType() === 'human')

  const invokeResult = await invokeDesignAgent({ schemaText }, messages, {
    buildingSchemaId: state.buildingSchemaId,
    latestVersionNumber: state.latestVersionNumber,
    designSessionId: state.designSessionId,
    repositories,
  })

  if (invokeResult.isErr()) {
    const errorMessage = `Unable to complete the database design. There may be conflicts in the requirements. Error: ${invokeResult.error.message}`

    await logAssistantMessage(state, repositories, errorMessage, assistantRole)

    // Create a human message for error feedback to avoid reasoning API issues
    // Using HumanMessage prevents the "reasoning without required following item" error
    const errorFeedbackMessage = new HumanMessage({
      content: `The previous attempt failed with the following error: ${invokeResult.error.message}. Please try a different approach to resolve the issue.`,
    })

    // Return state with error feedback as HumanMessage for self-recovery
    return {
      ...state,
      messages: [...state.messages, errorFeedbackMessage],
      error: invokeResult.error,
      retryCount: {
        ...state.retryCount,
        designSchemaNode: retryCount + 1,
      },
    }
  }

  const { response, reasoning } = invokeResult.value

  // Log reasoning summary if available
  if (reasoning?.summary && reasoning.summary.length > 0) {
    for (const summaryItem of reasoning.summary) {
      await logAssistantMessage(
        state,
        repositories,
        summaryItem.text,
        assistantRole,
      )
    }
  }

  // Apply timeline sync to the message and clear retry flags
  const syncedMessage = await withTimelineItemSync(response, {
    designSessionId: state.designSessionId,
    organizationId: state.organizationId || '',
    userId: state.userId,
    repositories,
    assistantRole,
  })

  return {
    ...state,
    messages: [syncedMessage],
    latestVersionNumber: state.latestVersionNumber + 1,
    retryCount: {
      ...state.retryCount,
      designSchemaNode: 0, // Reset retry count on success
    },
  }
}
