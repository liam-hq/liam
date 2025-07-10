import type { RunnableConfig } from '@langchain/core/runnables'
import { ResultAsync } from 'neverthrow'
import { PMAnalysisAgent } from '../../../langchain/agents'
import type { BasePromptVariables } from '../../../langchain/utils/types'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { formatHistory } from '../utils/formatHistory'
import { logAssistantMessage } from '../utils/timelineLogger'

const NODE_NAME = 'analyzeRequirementsNode'

/**
 * Analyze Requirements Node - Requirements Organization
 * Calls LLM with analysis tool binding, then delegates to executeAnalysisToolNode
 */
export async function analyzeRequirementsNode(
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
  const { repositories, logger } = configurableResult.value

  logger.log(`[${NODE_NAME}] Started`)

  await logAssistantMessage(state, repositories, 'Analyzing requirements...')

  const pmAnalysisAgent = new PMAnalysisAgent()

  const promptVariables: BasePromptVariables = {
    chat_history: formatHistory(state.messages),
    user_message: state.userInput,
  }

  const retryCount = state.retryCount[NODE_NAME] ?? 0

  await logAssistantMessage(
    state,
    repositories,
    'Organizing business and functional requirements...',
  )

  const analysisResult = await ResultAsync.fromPromise(
    (async () => {
      // Call the LLM to get tool call response
      const formattedPrompt =
        await pmAnalysisAgent.pmAnalysisPrompt.format(promptVariables)
      const response =
        await pmAnalysisAgent.analysisModel.invoke(formattedPrompt)

      logger.log(`[${NODE_NAME}] LLM invoked successfully`)

      return response
    })(),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  return analysisResult.match(
    async (response) => {
      return {
        ...state,
        messages: [response],
        error: undefined, // Clear error on success
      }
    },
    async (error) => {
      logger.error(`[${NODE_NAME}] Failed: ${error.message}`)

      await logAssistantMessage(
        state,
        repositories,
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
    },
  )
}
