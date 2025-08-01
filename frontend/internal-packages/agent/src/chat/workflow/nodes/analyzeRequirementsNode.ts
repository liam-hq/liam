import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { ResultAsync } from 'neverthrow'
import { PMAnalysisAgent } from '../../../langchain/agents'
import type { Repositories } from '../../../repositories'
import { WorkflowTerminationError } from '../../../shared/errorHandling'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'
import {
  createOrUpdateArtifact,
  transformWorkflowStateToArtifact,
} from '../utils/transformWorkflowStateToArtifact'
import { withTimelineItemSync } from '../utils/withTimelineItemSync'

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
 * Save artifacts if workflow state contains artifact data
 */
async function saveArtifacts(
  state: WorkflowState,
  repositories: Repositories,
  assistantRole: Database['public']['Enums']['assistant_role_enum'],
): Promise<void> {
  if (!state.analyzedRequirements && !state.generatedUsecases) {
    return
  }

  const artifact = transformWorkflowStateToArtifact(state)
  const artifactResult = await createOrUpdateArtifact(
    state,
    artifact,
    repositories,
  )

  if (artifactResult.success) {
    await logAssistantMessage(
      state,
      repositories,
      'Your requirements have been analyzed and saved',
      assistantRole,
    )
  } else {
    await logAssistantMessage(
      state,
      repositories,
      'Unable to save your requirements. Please try again or contact support...',
      assistantRole,
    )
  }
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
    throw new WorkflowTerminationError(
      configurableResult.error,
      'analyzeRequirementsNode',
    )
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(
    state,
    repositories,
    'Breaking down your request into structured requirements...',
    assistantRole,
  )

  const pmAnalysisAgent = new PMAnalysisAgent()

  const analysisResult = await ResultAsync.fromPromise(
    pmAnalysisAgent.generate(state.messages),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  return analysisResult.match(
    async ({ response, reasoning }) => {
      const analyzedRequirements = {
        businessRequirement: response.businessRequirement,
        functionalRequirements: response.functionalRequirements,
        nonFunctionalRequirements: response.nonFunctionalRequirements,
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

      // Create complete message with all analyzed requirements and sync to timeline
      const completeMessage = await withTimelineItemSync(
        new AIMessage({
          content: formatAnalyzedRequirements(analyzedRequirements),
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
      }

      // Save artifacts if requirements are successfully analyzed
      await saveArtifacts(updatedState, repositories, assistantRole)

      return updatedState
    },
    async (error) => {
      await logAssistantMessage(
        state,
        repositories,
        'Having trouble understanding your requirements. Let me try a different approach...',
        assistantRole,
      )

      throw new WorkflowTerminationError(error, 'analyzeRequirementsNode')
    },
  )
}
