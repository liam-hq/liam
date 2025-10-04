import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { runTestTool } from '../../tools/runTestTool'
import { generateDdlFromSchema } from '../../utils/generateDdl'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

const toolNode = new ToolNode([runTestTool])

export const invokeRunTestToolNode = async (
  state: QaAgentState,
  config: RunnableConfig,
): Promise<Partial<QaAgentState>> => {
  const ddlStatements = generateDdlFromSchema(state.schemaData)
  const requiredExtensions = Object.keys(state.schemaData.extensions).sort()

  const enhancedConfig: RunnableConfig = {
    ...config,
    configurable: {
      ...config.configurable,
      testcases: Object.values(state.analyzedRequirements.testcases).flat(),
      ddlStatements,
      requiredExtensions,
      designSessionId: state.designSessionId,
      analyzedRequirements: state.analyzedRequirements,
    },
  }

  return await toolNode.invoke(state, enhancedConfig)
}
