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
  console.info(`[designSchemaNode] Starting at ${new Date().toISOString()}`)

  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    throw new WorkflowTerminationError(
      configurableResult.error,
      'designSchemaNode',
    )
  }
  const { repositories } = configurableResult.value

  const schemaText = convertSchemaToText(state.schemaData)
  console.info(`[designSchemaNode] Initial schema text:\n${schemaText}`)
  console.info(
    '[designSchemaNode] Schema tables:',
    JSON.stringify(state.schemaData.tables, null, 2),
  )

  // Remove reasoning field from AIMessages to avoid API issues
  // This prevents the "reasoning without required following item" error
  const messages = removeReasoningFromMessages(state.messages)

  const invokeResult = await invokeDesignAgent({ schemaText }, messages, {
    buildingSchemaId: state.buildingSchemaId,
    latestVersionNumber: state.latestVersionNumber,
    designSessionId: state.designSessionId,
    repositories,
  })

  if (invokeResult.isErr()) {
    throw new WorkflowTerminationError(invokeResult.error, 'designSchemaNode')
  }

  const { response } = invokeResult.value

  console.info(`[designSchemaNode] Completed at ${new Date().toISOString()}`)

  return {
    ...state,
    messages: [response],
    latestVersionNumber: state.latestVersionNumber + 1,
  }
}
