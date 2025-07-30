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

  const schemaText = convertSchemaToText(state.schemaData)

  // Use existing messages
  const messages = [...state.messages]

  const invokeResult = await invokeDesignAgent({ schemaText }, messages, {
    buildingSchemaId: state.buildingSchemaId,
    latestVersionNumber: state.latestVersionNumber,
    designSessionId: state.designSessionId,
    repositories,
  })

  if (invokeResult.isErr()) {
    await logAssistantMessage(
      state,
      repositories,
      'Unable to complete the database design. There may be conflicts in the requirements...',
      assistantRole,
    )
    return {
      ...state,
      error: invokeResult.error,
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
  }
}
