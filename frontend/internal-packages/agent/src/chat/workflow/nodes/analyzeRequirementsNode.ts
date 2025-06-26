import { PMAnalysisAgent } from '../../../langchain/agents'
import type { BasePromptVariables } from '../../../langchain/utils/types'
import type { WorkflowState } from '../types'

const NODE_NAME = 'analyzeRequirementsNode'

/**
 * Analyze Requirements Node - Requirements Organization
 * Performed by pmAnalysisAgent
 */
export async function analyzeRequirementsNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  const pmAnalysisAgent = new PMAnalysisAgent()

  const promptVariables: BasePromptVariables = {
    chat_history: state.formattedHistory,
    user_message: state.userInput,
  }

  const retryCount = state.retryCount[NODE_NAME] ?? 0

  try {
    const analysisResult =
      await pmAnalysisAgent.analyzeRequirements(promptVariables)

    state.logger.log(`[${NODE_NAME}] Completed`)

    return {
      ...state,
      analyzedRequirements: {
        businessRequirement: analysisResult.businessRequirement,
        functionalRequirements: analysisResult.functionalRequirements,
        nonFunctionalRequirements: analysisResult.nonFunctionalRequirements,
      },
      error: undefined, // Clear error on success
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    state.logger.error(`[${NODE_NAME}] Failed: ${errorMessage}`)

    // Increment retry count and set error
    return {
      ...state,
      error: errorMessage,
      retryCount: {
        ...state.retryCount,
        [NODE_NAME]: retryCount + 1,
      },
    }
  }
}
