import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { ResultAsync } from 'neverthrow'
import { analysisTool } from '../../../langchain/agents/pmAnalysisAgent/agent'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'

const NODE_NAME = 'executeAnalysisToolNode'

// Create a ToolNode with the analysis tool
const toolNode = new ToolNode([analysisTool])

/**
 * Execute Analysis Tool Node - Handles tool execution
 * This node executes the analysis tool and updates the message state
 */
export async function executeAnalysisToolNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { logger } = configurableResult.value

  logger.log(`[${NODE_NAME}] Started`)

  const toolResult = await ResultAsync.fromPromise(
    toolNode.invoke(state, config),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  return toolResult.match(
    async (result) => {
      logger.log(`[${NODE_NAME}] Tool executed successfully`)

      return {
        ...state,
        ...result,
      }
    },
    async (error) => {
      logger.error(`[${NODE_NAME}] Failed: ${error.message}`)

      return {
        ...state,
        error,
      }
    },
  )
}
