import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import type { PmAgentState } from '../pmAgentAnnotations'
import { saveRequirementsToArtifactTool } from '../tools/saveRequirementsToArtifactTool'

/**
 * Invoke Save Artifact Tool Node - Uses ToolNode to save artifacts
 * This follows the same pattern as invokeSchemaDesignToolNode
 */
export const invokeSaveArtifactToolNode = async (
  state: PmAgentState,
  config: RunnableConfig,
) => {
  const toolNode = new ToolNode([saveRequirementsToArtifactTool])

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
