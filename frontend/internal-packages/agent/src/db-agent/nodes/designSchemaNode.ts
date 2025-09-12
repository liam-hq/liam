import type { RunnableConfig } from '@langchain/core/runnables'
import { convertSchemaToText } from '../../utils/convertSchemaToText'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { getConfigurable } from '../../utils/getConfigurable'
import {
  excludeOperationalMessages,
  removeReasoningFromMessages,
} from '../../utils/messageCleanup'
import { invokeDesignAgent } from '../invokeDesignAgent'
import type { DbAgentState } from '../shared/dbAgentAnnotation'

/**
 * Design Schema Node - DB Design & DDL Execution
 * Performed by dbAgent
 */
export async function designSchemaNode(
  state: DbAgentState,
  config: RunnableConfig,
): Promise<DbAgentState> {
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
  // Also exclude operational messages that are incompatible with LLM APIs
  const cleanedMessages = removeReasoningFromMessages(state.messages)
  const messages = excludeOperationalMessages(cleanedMessages)

  const invokeResult = await invokeDesignAgent(
    {
      schemaText,
      prompt: state.prompt,
    },
    messages,
    {
      buildingSchemaId: state.buildingSchemaId,
      latestVersionNumber: state.latestVersionNumber,
      designSessionId: state.designSessionId,
      repositories,
    },
  )

  if (invokeResult.isErr()) {
    throw new WorkflowTerminationError(invokeResult.error, 'designSchemaNode')
  }

  const { response } = invokeResult.value

  return {
    ...state,
    messages: [response],
    latestVersionNumber: state.latestVersionNumber + 1,
  }
}
