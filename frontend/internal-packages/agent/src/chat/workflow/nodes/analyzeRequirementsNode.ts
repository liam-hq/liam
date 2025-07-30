import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { PMAnalysisAgent } from '../../../langchain/agents'
import type { Reasoning } from '../../../langchain/utils/types'
import type { Repositories } from '../../../repositories'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'
import {
  createOrUpdateArtifact,
  transformWorkflowStateToArtifact,
} from '../utils/transformWorkflowStateToArtifact'
import { withTimelineItemSync } from '../utils/withTimelineItemSync'

/**
 * Format analyzed requirements as markdown
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
 * Format response content with optional reasoning data
 */
function formatResponseContent(
  analyzedRequirements: NonNullable<WorkflowState['analyzedRequirements']>,
  reasoning: Reasoning | null,
): string {
  const analysisMarkdown = formatAnalyzedRequirements(analyzedRequirements)

  if (reasoning?.summary && reasoning.summary.length > 0) {
    const reasoningMarkdown = reasoning.summary
      .map((item, index: number) => `${index + 1}. ${item.text}`)
      .join('\n')

    return `${analysisMarkdown}\n\n## Reasoning Summary:\n${reasoningMarkdown}`
  }

  return analysisMarkdown
}

/**
 * Save analyzed requirements as artifacts
 */
async function saveAnalyzedRequirements(
  state: WorkflowState,
  repositories: Repositories,
  analyzedRequirements: NonNullable<WorkflowState['analyzedRequirements']>,
  assistantRole: Database['public']['Enums']['assistant_role_enum'],
): Promise<void> {
  const updatedState = {
    ...state,
    analyzedRequirements,
  }

  const artifact = transformWorkflowStateToArtifact(updatedState)
  const artifactResult = await createOrUpdateArtifact(
    updatedState,
    artifact,
    repositories,
  )

  if (artifactResult.success) {
    await logAssistantMessage(
      state,
      repositories,
      'Requirements analysis has been saved and structured for implementation',
      assistantRole,
    )
  } else {
    await logAssistantMessage(
      state,
      repositories,
      'Unable to save requirements analysis. Please try again or contact support...',
      assistantRole,
    )
  }
}

/**
 * Analyze Requirements Node - Requirements Organization
 * Performed by pmAnalysisAgent
 */
async function attemptAnalysis(
  state: WorkflowState,
  repositories: Repositories,
  assistantRole: Database['public']['Enums']['assistant_role_enum'],
  currentRetryCount: number,
): Promise<WorkflowState> {
  const maxRetries = 3

  const pmAnalysisAgent = new PMAnalysisAgent()

  const generationResult = await pmAnalysisAgent.generate(state.messages)

  return generationResult.match(
    async (analysisWithReasoning) => {
      // Extract structured analysis and reasoning from PMAnalysisAgent
      // Note: PMAnalysisAgent uses manual JSON parsing instead of withStructuredOutput
      // to support both tool usage (web_search_preview) and o4-mini reasoning capabilities
      const { response: analyzedRequirements, reasoning } =
        analysisWithReasoning

      // Create response content with reasoning if available
      const responseContent = formatResponseContent(
        analyzedRequirements,
        reasoning,
      )

      // Create complete message with the analysis result and sync to timeline
      const completeMessage = await withTimelineItemSync(
        new AIMessage({
          content: responseContent,
          name: 'PMAnalysisAgent',
        }),
        {
          designSessionId: state.designSessionId,
          organizationId: state.organizationId || '',
          userId: state.userId,
          repositories,
          assistantRole,
        },
      )

      const updatedState = {
        ...state,
        messages: [completeMessage],
        analyzedRequirements,
        error: undefined, // Clear error on success
        retryCount: {
          ...state.retryCount,
          ['analyzeRequirementsNode']: 0, // Reset retry count on success
        },
      }

      // Log reasoning summary if available
      if (reasoning?.summary && reasoning.summary.length > 0) {
        for (const summaryItem of reasoning.summary) {
          await logAssistantMessage(
            state,
            repositories,
            summaryItem.text,
            assistantRole,
          )
        }
      }

      // Save the analyzed requirements as artifacts
      await saveAnalyzedRequirements(
        updatedState,
        repositories,
        analyzedRequirements,
        assistantRole,
      )

      return updatedState
    },
    async (error) => {
      const newRetryCount = currentRetryCount + 1

      if (newRetryCount <= maxRetries) {
        await logAssistantMessage(
          state,
          repositories,
          `Having trouble understanding your requirements. Let me try a different approach... (Attempt ${newRetryCount}/${maxRetries})`,
          assistantRole,
        )

        // Retry with updated retry count
        return attemptAnalysis(
          {
            ...state,
            retryCount: {
              ...state.retryCount,
              ['analyzeRequirementsNode']: newRetryCount,
            },
          },
          repositories,
          assistantRole,
          newRetryCount,
        )
      }
      await logAssistantMessage(
        state,
        repositories,
        `Unable to analyze requirements after ${maxRetries} attempts. Please try rephrasing your request or contact support.`,
        assistantRole,
      )

      return {
        ...state,
        error,
        retryCount: {
          ...state.retryCount,
          ['analyzeRequirementsNode']: newRetryCount,
        },
      }
    },
  )
}

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
    'Breaking down your request into structured requirements...',
    assistantRole,
  )

  const retryCount = state.retryCount['analyzeRequirementsNode'] ?? 0

  return attemptAnalysis(state, repositories, assistantRole, retryCount)
}
