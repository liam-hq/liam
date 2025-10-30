import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import type { PmAgentState } from '../pmAgentAnnotations'
import { processAnalyzedRequirementsTool } from '../tools/processAnalyzedRequirementsTool'

/**
 * Invoke Save Artifact Tool Node - Uses ToolNode to process analyzed requirements
 * This follows the same pattern as invokeCreateMigrationToolNode
 */
export const invokeSaveArtifactToolNode = async (
  state: PmAgentState,
  config: RunnableConfig,
) => {
  const toolNode = new ToolNode([processAnalyzedRequirementsTool])

  const stream = await toolNode.stream(state, {
    configurable: {
      ...config.configurable,
      designSessionId: state.designSessionId,
    },
  })

  let result = {}

  for await (const chunk of stream) {
    result = chunk
  }

  return result
}
