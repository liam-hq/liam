import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { invokeDesignAgent } from '../../../langchain/agents/databaseSchemaBuildAgent/agent'
import { WorkflowTerminationError } from '../../../shared/errorHandling'
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
    throw new WorkflowTerminationError(
      configurableResult.error,
      'designSchemaNode',
    )
  }
  const { repositories } = configurableResult.value

  const schemaText = convertSchemaToText(state.schemaData)

  // Remove reasoning field from AIMessages to avoid API issues
  // This prevents the "reasoning without required following item" error
  const messages = state.messages.map((msg) => {
    if (msg instanceof AIMessage) {
      // Create a new AIMessage without the reasoning field
      // Clone the message but exclude reasoning if it exists
      const {
        content,
        additional_kwargs,
        response_metadata,
        tool_calls,
        invalid_tool_calls,
        usage_metadata,
      } = msg
      const cleanedKwargs = { ...additional_kwargs }

      // Remove reasoning from additional_kwargs if it exists
      if ('reasoning' in cleanedKwargs) {
        delete cleanedKwargs['reasoning']
      }

      // Preserve all other message properties including tool_calls
      const aiMessageFields: {
        content: typeof content
        additional_kwargs: typeof cleanedKwargs
        response_metadata: typeof response_metadata
        tool_calls?: typeof tool_calls
        invalid_tool_calls?: typeof invalid_tool_calls
        usage_metadata?: typeof usage_metadata
      } = {
        content,
        additional_kwargs: cleanedKwargs,
        response_metadata,
      }

      // Only add optional fields if they are defined
      if (tool_calls !== undefined) {
        aiMessageFields.tool_calls = tool_calls
      }
      if (invalid_tool_calls !== undefined) {
        aiMessageFields.invalid_tool_calls = invalid_tool_calls
      }
      if (usage_metadata !== undefined) {
        aiMessageFields.usage_metadata = usage_metadata
      }

      return new AIMessage(aiMessageFields)
    }
    return msg
  })

  const invokeResult = await invokeDesignAgent({ schemaText }, messages, {
    buildingSchemaId: state.buildingSchemaId,
    latestVersionNumber: state.latestVersionNumber,
    designSessionId: state.designSessionId,
    repositories,
  })

  if (invokeResult.isErr()) {
    throw new WorkflowTerminationError(invokeResult.error, 'designSchemaNode')
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
  }
}
