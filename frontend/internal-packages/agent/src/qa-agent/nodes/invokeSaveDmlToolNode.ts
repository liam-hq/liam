import type { BaseMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import type { WorkflowState } from '../../chat/workflow/types'
import { saveDmlOperationsTool } from '../tools/saveDmlOperationsTool'

const toolNode = new ToolNode([saveDmlOperationsTool])

export const invokeSaveDmlToolNode = async (
  state: WorkflowState,
  config: RunnableConfig,
): Promise<{ messages: BaseMessage[] }> => {
  return toolNode.invoke(state, {
    configurable: {
      ...config.configurable,
      testcases: state.generatedTestcases,
    },
  })
}
