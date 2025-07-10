import { ResultAsync } from 'neverthrow'
import { QAGenerateUsecaseAgent } from '../../../langchain/agents'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { BasePromptVariables } from '../../../langchain/utils/types'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'

const NODE_NAME = 'generateUsecaseNode'

/**
 * Log usecase generation results for debugging/monitoring purposes
 * TODO: Remove this function once the feature is stable and monitoring is no longer needed
 */
const logUsecaseResults = (
  logger: WorkflowState['logger'],
  usecases: Usecase[],
): void => {
  logger.log(`[${NODE_NAME}] Generated ${usecases.length} use cases`)

  usecases.forEach((usecase, index) => {
    logger.log(
      `[${NODE_NAME}] Usecase ${index + 1} (${usecase.requirementType}): ${JSON.stringify(usecase)}`,
    )
  })
}

/**
 * Format analyzed requirements into a structured text for AI processing
 */
function formatAnalyzedRequirements(
  analyzedRequirements: NonNullable<WorkflowState['analyzedRequirements']>,
  userInput: string,
): string {
  return `
Business Requirement: ${analyzedRequirements.businessRequirement}

Functional Requirements:
${Object.entries(analyzedRequirements.functionalRequirements)
  .map(
    ([category, requirements]) =>
      `${category}:\n${requirements.map((req) => `- ${req}`).join('\n')}`,
  )
  .join('\n\n')}

Non-Functional Requirements:
${Object.entries(analyzedRequirements.nonFunctionalRequirements)
  .map(
    ([category, requirements]) =>
      `${category}:\n${requirements.map((req) => `- ${req}`).join('\n')}`,
  )
  .join('\n\n')}

Original User Input: ${userInput}
`
}

/**
 * Generate Usecase Node - QA Agent creates use cases
 * Performed by qaGenerateUsecaseAgent
 */
export async function generateUsecaseNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  await logAssistantMessage(state, 'Generating use cases...')

  // Check if we have analyzed requirements
  if (!state.analyzedRequirements) {
    const errorMessage =
      'No analyzed requirements found. Cannot generate use cases.'
    const error = new Error(`[${NODE_NAME}] ${errorMessage}`)
    state.logger.error(error.message)

    await logAssistantMessage(
      state,
      'Error occurred during use case generation',
    )

    return {
      ...state,
      error,
    }
  }

  const qaAgent = new QAGenerateUsecaseAgent()

  // Create a user message that includes the analyzed requirements
  const requirementsText = formatAnalyzedRequirements(
    state.analyzedRequirements,
    state.userInput,
  )

  const promptVariables: BasePromptVariables = {
    chat_history: state.formattedHistory,
    user_message: requirementsText,
  }

  const retryCount = state.retryCount[NODE_NAME] ?? 0

  await logAssistantMessage(state, 'Analyzing test cases and queries...')

  const usecaseResult = await ResultAsync.fromPromise(
    qaAgent.generate(promptVariables),
    (error) => (error instanceof Error ? error.message : String(error)),
  )

  if (usecaseResult.isErr()) {
    const errorMessage = usecaseResult.error
    const error = new Error(`[${NODE_NAME}] Failed: ${errorMessage}`)
    state.logger.error(error.message)

    await logAssistantMessage(
      state,
      'Error occurred during use case generation',
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

  const result = usecaseResult.value
  logUsecaseResults(state.logger, result.usecases)

  await logAssistantMessage(state, 'Use case generation completed')

  state.logger.log(`[${NODE_NAME}] Completed`)

  return {
    ...state,
    generatedUsecases: result.usecases,
    error: undefined,
  }
}
