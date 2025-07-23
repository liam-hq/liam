import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { ResultAsync } from 'neverthrow'
import { PMAnalysisAgent } from '../../../langchain/agents'
import type { BasePromptVariables } from '../../../langchain/utils/types'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { formatMessagesToHistory } from '../utils/messageUtils'
import { logAssistantMessage } from '../utils/timelineLogger'

/**
 * Format analyzed requirements into a structured string
 */
const formatAnalyzedRequirements = (
  analyzedRequirements: NonNullable<WorkflowState['analyzedRequirements']>,
): string => {
  const formatRequirements = (
    requirements: Record<string, string[]>,
    title: string,
  ): string => {
    const entries = Object.entries(requirements)
    if (entries.length === 0) return ''

    return `${title}:
${entries
  .map(
    ([category, items]) =>
      `- ${category}:\n  ${items.map((item) => `  • ${item}`).join('\n')}`,
  )
  .join('\n')}`
  }

  const sections = [
    `Business Requirement:\n${analyzedRequirements.businessRequirement}`,
    formatRequirements(
      analyzedRequirements.functionalRequirements,
      'Functional Requirements',
    ),
    formatRequirements(
      analyzedRequirements.nonFunctionalRequirements,
      'Non-Functional Requirements',
    ),
  ].filter(Boolean)

  return sections.join('\n\n')
}

/**
 * Analyze Requirements Node - Requirements Organization
 * Performed by pmAnalysisAgent
 */
export async function analyzeRequirementsNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const assistantRole: Database['public']['Enums']['assistant_role_enum'] = 'pm'
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(
    state,
    repositories,
    'Analyzing requirements...',
    assistantRole,
  )

  const pmAnalysisAgent = new PMAnalysisAgent()

  const promptVariables: BasePromptVariables = {
    chat_history: formatMessagesToHistory(state.messages),
    user_message: state.userInput,
  }

  const retryCount = state.retryCount['analyzeRequirementsNode'] ?? 0

  await logAssistantMessage(
    state,
    repositories,
    'Organizing business and functional requirements...',
    assistantRole,
  )

  const analysisResult = await ResultAsync.fromPromise(
    pmAnalysisAgent.analyzeRequirements(promptVariables),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  return analysisResult.match(
    async (result) => {
      await logAssistantMessage(
        state,
        repositories,
        'Requirements analysis completed',
        assistantRole,
      )

      const analyzedRequirements = {
        businessRequirement: result.businessRequirement,
        functionalRequirements: result.functionalRequirements,
        nonFunctionalRequirements: result.nonFunctionalRequirements,
      }

      // Create complete message with all analyzed requirements
      const completeMessage = new AIMessage({
        content: formatAnalyzedRequirements(analyzedRequirements),
        name: 'PMAnalysisAgent',
      })

      return {
        ...state,
        messages: [completeMessage],
        analyzedRequirements,
        error: undefined, // Clear error on success
      }
    },
    async (error) => {
      await logAssistantMessage(
        state,
        repositories,
        'Error occurred during requirements analysis',
        assistantRole,
        true,
      )

      return {
        ...state,
        error,
        retryCount: {
          ...state.retryCount,
          ['analyzeRequirementsNode']: retryCount + 1,
        },
      }
    },
  )
}
