import { ResultAsync } from 'neverthrow'
import type * as v from 'valibot'
import { PMAnalysisAgent } from '../../../langchain/agents'
import type { requirementsAnalysisSchema } from '../../../langchain/agents/pmAnalysisAgent/agent'
import type { BasePromptVariables } from '../../../langchain/utils/types'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'

const NODE_NAME = 'analyzeRequirementsNode'

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

  await logAssistantMessage(state, 'Analyzing requirements...')

  const pmAnalysisAgent = new PMAnalysisAgent()

  const promptVariables: BasePromptVariables = {
    chat_history: state.formattedHistory,
    user_message: state.userInput,
  }

  const retryCount = state.retryCount[NODE_NAME] ?? 0

  await logAssistantMessage(
    state,
    'Organizing business and functional requirements...',
  )

  const analysisResult = await ResultAsync.fromPromise(
    pmAnalysisAgent.analyzeRequirements(promptVariables),
    (error) => (error instanceof Error ? error.message : String(error)),
  )

  if (analysisResult.isErr()) {
    const errorMessage = analysisResult.error
    const error = new Error(`[${NODE_NAME}] Failed: ${errorMessage}`)
    state.logger.error(error.message)

    await logAssistantMessage(
      state,
      'Error occurred during requirements analysis',
    )

    return {
      ...state,
      error,
      retryCount: {
        ...state.retryCount,
        [NODE_NAME]: retryCount + 1,
      },
    }
  }

  const result = analysisResult.value
  logAnalysisResult(state.logger, result)

  await logAssistantMessage(state, 'Requirements analysis completed')

  state.logger.log(`[${NODE_NAME}] Completed`)

  return {
    ...state,
    analyzedRequirements: {
      businessRequirement: result.businessRequirement,
      functionalRequirements: result.functionalRequirements,
      nonFunctionalRequirements: result.nonFunctionalRequirements,
    },
    error: undefined,
  }
}
