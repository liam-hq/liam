import type * as v from 'valibot'
import { PMAnalysisAgent } from '../../../langchain/agents'
import type { requirementsAnalysisSchema } from '../../../langchain/agents/pmAnalysisAgent/agent'
import type { BasePromptVariables } from '../../../langchain/utils/types'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { incrementRetryCount } from '../shared/retryUtils'
import type { WorkflowState } from '../types'

const NODE_NAME = 'analyzeRequirements'

type AnalysisResult = v.InferOutput<typeof requirementsAnalysisSchema>

/**
 * Log analysis results for debugging/monitoring purposes
 * TODO: Remove this function once the feature is stable and monitoring is no longer needed
 */
const logAnalysisResult = (
  logger: WorkflowState['logger'],
  result: AnalysisResult,
): void => {
  logger.log(`[${NODE_NAME}] Analysis Result:`)
  logger.log(`[${NODE_NAME}] BRD: ${result.businessRequirement}`)
  logger.log(
    `[${NODE_NAME}] Functional Requirements: ${JSON.stringify(result.functionalRequirements)}`,
  )
  logger.log(
    `[${NODE_NAME}] Non-Functional Requirements: ${JSON.stringify(result.nonFunctionalRequirements)}`,
  )
}

/**
 * Analyze Requirements Node - Requirements Organization
 * Performed by pmAnalysisAgent
 */
export async function analyzeRequirementsNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  const pmAnalysisAgent = new PMAnalysisAgent()
  const schemaText = convertSchemaToText(state.schemaData)

  const promptVariables: BasePromptVariables = {
    schema_text: schemaText,
    chat_history: state.formattedHistory,
    user_message: state.userInput,
  }

  try {
    const analysisResult =
      await pmAnalysisAgent.analyzeRequirements(promptVariables)

    // Log the analysis result for debugging/monitoring purposes
    logAnalysisResult(state.logger, analysisResult)

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
    return incrementRetryCount(state, NODE_NAME, errorMessage)
  }
}
