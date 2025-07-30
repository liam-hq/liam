import { AIMessage } from '@langchain/core/messages'
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

  // Use existing messages (includes previous error messages for self-recovery)
  const messages = [...state.messages]

  const invokeResult = await invokeDesignAgent({ schemaText }, messages, {
    buildingSchemaId: state.buildingSchemaId,
    latestVersionNumber: state.latestVersionNumber,
    designSessionId: state.designSessionId,
    repositories,
  })

  if (invokeResult.isErr()) {
    const errorMessage = `Unable to complete the database design. There may be conflicts in the requirements. Error: ${invokeResult.error.message}`

    await logAssistantMessage(state, repositories, errorMessage, assistantRole)

    // Create an error message for the AI to learn from
    const aiErrorMessage = new AIMessage({
      content: `Previous attempt failed with error: ${invokeResult.error.message}. Please adjust your approach and try a different strategy to resolve the conflicts in the requirements.`,
      additional_kwargs: {
        role: assistantRole,
        error: true,
      },
    })

    // Apply timeline sync to the error message
    const syncedErrorMessage = await withTimelineItemSync(aiErrorMessage, {
      designSessionId: state.designSessionId,
      organizationId: state.organizationId || '',
      userId: state.userId,
      repositories,
      assistantRole,
    })

    // Return state with error message added for self-recovery
    return {
      ...state,
      messages: [...state.messages, syncedErrorMessage],
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
