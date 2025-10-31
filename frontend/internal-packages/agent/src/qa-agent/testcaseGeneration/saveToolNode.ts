import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { saveTestcaseTool } from '../tools/saveTestcaseTool'
import type { testcaseAnnotation } from './testcaseAnnotation'

/**
 * Save Tool Node for testcase generation
 * Executes the saveTestcaseTool within the isolated subgraph context with streaming support
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

  const stream = await toolNode.stream(toolNodeInput, config)

  let result = {}

  for await (const chunk of stream) {
    result = chunk
  }

  if ('messages' in result) {
    return {
      ...result,
      internalMessages: result.messages,
      messages: [],
    }
  }

  return result
}
