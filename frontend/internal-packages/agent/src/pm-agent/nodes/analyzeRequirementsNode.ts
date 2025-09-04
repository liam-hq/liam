import type { RunnableConfig } from '@langchain/core/runnables'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import { convertSchemaToText } from '../../utils/convertSchemaToText'
import { getConfigurable } from '../../workflow/shared/getConfigurable'
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

  const analysisResult = await invokePmAnalysisAgent(
    { schemaText },
    state.messages,
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
