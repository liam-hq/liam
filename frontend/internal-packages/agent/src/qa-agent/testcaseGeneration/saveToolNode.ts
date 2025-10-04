import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { saveTestcaseTool } from '../tools/saveTestcaseTool'
import type { testcaseAnnotation } from './testcaseAnnotation'

/**
 * Save Tool Node for testcase generation
 * Executes the saveTestcaseTool within the isolated subgraph context with streaming support
 */
export const saveToolNode = async (
  state: typeof testcaseAnnotation.State,
  config?: RunnableConfig,
) => {
  const toolNode = new ToolNode([saveTestcaseTool])

  const stream = await toolNode.stream(state, config)

  let result = {}

  for await (const chunk of stream) {
    result = chunk
  }

  return result
}
