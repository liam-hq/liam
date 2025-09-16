import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { runSingleTestTool } from '../../tools/runSingleTestTool'
import { generateDdlFromSchema } from '../../utils/generateDdl'
import type { testcaseAnnotation } from './testcaseAnnotation'

const toolNode = new ToolNode([runSingleTestTool])

export const invokeSingleTestToolNode = async (
  state: typeof testcaseAnnotation.State,
  config: RunnableConfig,
): Promise<Partial<typeof testcaseAnnotation.State>> => {
  const ddlStatements = generateDdlFromSchema(state.schemaData)
  const requiredExtensions = Object.keys(state.schemaData.extensions).sort()

  const enhancedConfig: RunnableConfig = {
    ...config,
    configurable: {
      ...config.configurable,
      testcases: state.testcases,
      ddlStatements,
      requiredExtensions,
    },
  }

  return await toolNode.invoke(state, enhancedConfig)
}
