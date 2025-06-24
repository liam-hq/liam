import { QAGenerateUsecaseAgent } from '../../../langchain/agents'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { BasePromptVariables } from '../../../langchain/utils/types'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import type { WorkflowState } from '../types'

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

  // Check if we have analyzed requirements
  if (!state.analyzedRequirements) {
    const errorMessage =
      'No analyzed requirements found. Cannot generate use cases.'
    state.logger.error(`[${NODE_NAME}] ${errorMessage}`)
    return {
      ...state,
      error: errorMessage,
    }
  }

  const qaAgent = new QAGenerateUsecaseAgent()
  const schemaText = convertSchemaToText(state.schemaData)

  // Create a user message that includes the analyzed requirements
  const requirementsText = formatAnalyzedRequirements(
    state.analyzedRequirements,
    state.userInput,
  )

  const promptVariables: BasePromptVariables = {
    schema_text: schemaText,
    chat_history: state.formattedHistory,
    user_message: requirementsText,
  }

  const retryCount = state.retryCount[NODE_NAME] ?? 0

  try {
    const result = await qaAgent.generate(promptVariables)

    // Log the usecase results for debugging/monitoring purposes
    logUsecaseResults(state.logger, result.usecases)

    state.logger.log(`[${NODE_NAME}] Completed`)

    return {
      ...state,
      generatedUsecases: result.usecases,
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
