import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { saveTestcaseTool } from '../tools/saveTestcaseTool'
import type { testcaseAnnotation } from './testcaseAnnotation'

/**
 * Save Tool Node for testcase generation
 * Executes the saveTestcaseTool within the isolated subgraph context
 * Maps internalMessages to messages for ToolNode compatibility
 */
export const saveToolNode = async (
  state: typeof testcaseAnnotation.State,
  config?: RunnableConfig,
) => {
  const toolNode = new ToolNode([saveTestcaseTool])

  const toolNodeInput = {
    ...state,
    messages: state.internalMessages,
  }

  const result = await toolNode.invoke(toolNodeInput, config)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- ToolNode result type is not well-typed
  if ('messages' in result && Array.isArray(result.messages)) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- ToolNode result type is not well-typed
      internalMessages: result.messages,
    }
  }

  return result
}
