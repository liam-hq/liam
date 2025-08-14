import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import type { WorkflowState } from '../../chat/workflow/types'
import { saveRequirementsToArtifactTool } from '../tools/saveRequirementsToArtifactTool'

/**
 * Invoke Save Artifact Tool Node - Uses ToolNode to save artifacts
 * This follows the same pattern as invokeSchemaDesignToolNode
 */
export const invokeSaveArtifactToolNode = async (
  state: WorkflowState,
  config: RunnableConfig,
) => {
  const toolNode = new ToolNode([saveRequirementsToArtifactTool])

  return toolNode.invoke(state, {
    configurable: {
      ...config.configurable,
      designSessionId: state.designSessionId,
    },
  })
}
