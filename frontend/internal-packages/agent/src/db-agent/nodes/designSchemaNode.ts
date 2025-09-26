import type { RunnableConfig } from '@langchain/core/runnables'
import { convertSchemaToText } from '../../utils/convertSchemaToText'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { getConfigurable } from '../../utils/getConfigurable'
import { removeReasoningFromMessages } from '../../utils/messageCleanup'
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
  const messages = removeReasoningFromMessages(state.messages)

  const invokeResult = await invokeDesignAgent(
    {
      schemaText,
      prompt: state.prompt,
    },
    messages,
    {
      buildingSchemaId: state.buildingSchemaId,
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
    messages: [...state.messages, response],
    designSchemaRetryCount: (state.designSchemaRetryCount ?? 0) + 1,
    // Reset success flag when retrying
    schemaDesignSuccessful: false,
  }
}
