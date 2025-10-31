import type { RunnableConfig } from '@langchain/core/runnables'
import { Result } from '@liam-hq/neverthrow'
import { yamlSchemaDeparser } from '@liam-hq/schema'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { getConfigurable } from '../../utils/getConfigurable'
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
  const combinedResult = Result.combine([
    getConfigurable(config),
    yamlSchemaDeparser(state.schemaData),
  ])

  if (combinedResult.isErr()) {
    throw new WorkflowTerminationError(
      combinedResult.error,
      'analyzeRequirementsNode',
    )
  }

  const [configurable, schemaText] = combinedResult.value

  const analysisResult = await invokePmAnalysisAgent(
    { schemaText },
    state.messages,
    configurable,
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
