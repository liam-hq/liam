import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import type { WorkflowState } from '../../chat/workflow/types'
import { schemaDesignTool } from '../tools/schemaDesignTool'

export const invokeSchemaDesignToolNode = (
  state: WorkflowState,
  config: RunnableConfig,
) => {
  const toolNode = new ToolNode([schemaDesignTool])

  return toolNode.invoke(state, {
    configurable: {
      ...config.configurable,
      buildingSchemaVersionId: state.buildingSchemaVersionId,
    },
  })
}
