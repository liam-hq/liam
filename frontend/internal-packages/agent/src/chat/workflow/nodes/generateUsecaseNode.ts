import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { ResultAsync } from 'neverthrow'
import { QAGenerateUsecaseAgent } from '../../../langchain/agents'
import type { BasePromptVariables } from '../../../langchain/utils/types'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { formatMessagesToHistory } from '../utils/messageUtils'
import { logAssistantMessage } from '../utils/timelineLogger'

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
  config: RunnableConfig,
): Promise<WorkflowState> {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(state, repositories, 'Generating use cases...')

  // Check if we have analyzed requirements
  if (!state.analyzedRequirements) {
    const errorMessage =
      'No analyzed requirements found. Cannot generate use cases.'

    await logAssistantMessage(
      state,
      repositories,
      'Error occurred during use case generation',
    )

    return {
      ...state,
      error: new Error(errorMessage),
    }
  }

  const qaAgent = new QAGenerateUsecaseAgent()

  // Create a user message that includes the analyzed requirements
  const requirementsText = formatAnalyzedRequirements(
    state.analyzedRequirements,
    state.userInput,
  )

  const promptVariables: BasePromptVariables = {
    chat_history: formatMessagesToHistory(state.messages),
    user_message: requirementsText,
  }

  const retryCount = state.retryCount['generateUsecaseNode'] ?? 0

  await logAssistantMessage(
    state,
    repositories,
    'Analyzing test cases and queries...',
  )

  const usecaseResult = await ResultAsync.fromPromise(
    qaAgent.generate(promptVariables),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  return await usecaseResult.match(
    async (generatedResult) => {
      await logAssistantMessage(
        state,
        repositories,
        'Use case generation completed',
      )

      return {
        ...state,
        messages: [
          ...state.messages,
          new AIMessage({
            content: `Generated ${generatedResult.usecases.length} use cases for testing and validation`,
            name: 'QA Generate Usecase Agent',
          }),
        ],
        generatedUsecases: generatedResult.usecases,
        error: undefined, // Clear error on success
      }
    },
    async (error) => {
      await logAssistantMessage(
        state,
        repositories,
        'Error occurred during use case generation',
      )

      // Increment retry count and set error
      return {
        ...state,
        error: error,
        retryCount: {
          ...state.retryCount,
          ['generateUsecaseNode']: retryCount + 1,
        },
      }
    },
  )
}
