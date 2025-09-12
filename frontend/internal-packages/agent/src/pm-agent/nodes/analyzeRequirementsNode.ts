import type { RunnableConfig } from '@langchain/core/runnables'
import { convertSchemaToText } from '../../utils/convertSchemaToText'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { getConfigurable } from '../../utils/getConfigurable'
import { excludeOperationalMessages } from '../../utils/messageCleanup'
import { invokePmAnalysisAgent } from '../invokePmAnalysisAgent'
import type { PmAgentState } from '../pmAgentAnnotations'

/**
 * Analyze Requirements Node - Requirements Organization
 * Performed by pmAnalysisAgent
 */
export async function analyzeRequirementsNode(
  state: PmAgentState,
  config: RunnableConfig,
): Promise<Partial<PmAgentState>> {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    throw new WorkflowTerminationError(
      configurableResult.error,
      'analyzeRequirementsNode',
    )
  }

  const schemaText = convertSchemaToText(state.schemaData)

  // Exclude operational messages that are incompatible with LLM APIs
  const filteredMessages = excludeOperationalMessages(state.messages)

  const analysisResult = await invokePmAnalysisAgent(
    { schemaText },
    filteredMessages,
    configurableResult.value,
  )

  if (analysisResult.isErr()) {
    throw new WorkflowTerminationError(
      analysisResult.error,
      'analyzeRequirementsNode',
    )
  }

  const { response } = analysisResult.value

  return {
    messages: [response],
    analyzedRequirementsRetryCount: state.analyzedRequirementsRetryCount + 1,
  }
}
