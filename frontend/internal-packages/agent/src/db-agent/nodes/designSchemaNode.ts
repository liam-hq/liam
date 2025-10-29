import type { RunnableConfig } from '@langchain/core/runnables'
import { Result } from '@liam-hq/neverthrow'
import { yamlSchemaDeparser } from '@liam-hq/schema'
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
  const combinedResult = Result.combine([
    getConfigurable(config),
    yamlSchemaDeparser(state.schemaData),
  ])

  if (combinedResult.isErr()) {
    throw new WorkflowTerminationError(combinedResult.error, 'designSchemaNode')
  }
  const [{ repositories }, schemaText] = combinedResult.value

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
    // Reset success flag when retrying
    schemaDesignSuccessful: false,
  }
}
