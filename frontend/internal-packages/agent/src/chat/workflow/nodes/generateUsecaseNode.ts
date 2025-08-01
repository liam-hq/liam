import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { ResultAsync } from 'neverthrow'
import { QAGenerateUsecaseAgent } from '../../../langchain/agents'
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
      'Your use cases have been saved and are ready for implementation',
      assistantRole,
    )
  } else {
    await logAssistantMessage(
      state,
      repositories,
      'Unable to save your use cases. Please try again or contact support...',
      assistantRole,
    )
  }
}

/**
 * Generate Usecase Node - QA Agent creates use cases
 * Performed by qaGenerateUsecaseAgent
 */
export async function generateUsecaseNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const assistantRole: Database['public']['Enums']['assistant_role_enum'] = 'qa'
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    throw new WorkflowTerminationError(
      configurableResult.error,
      'generateUsecaseNode',
    )
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(
    state,
    repositories,
    'Creating test scenarios to validate your database design...',
    assistantRole,
  )

  // Check if we have analyzed requirements
  if (!state.analyzedRequirements) {
    const errorMessage =
      'No analyzed requirements found. Cannot generate use cases.'

    await logAssistantMessage(
      state,
      repositories,
      'Unable to generate test scenarios. This might be due to unclear requirements...',
      assistantRole,
    )

    throw new WorkflowTerminationError(
      new Error(errorMessage),
      'generateUsecaseNode',
    )
  }

  const qaAgent = new QAGenerateUsecaseAgent()

  // Use state.messages directly - includes error messages and all context
  const usecaseResult = await ResultAsync.fromPromise(
    qaAgent.generate(state.messages),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  return await usecaseResult.match(
    async ({ response, reasoning }) => {
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

      const usecaseMessage = await withTimelineItemSync(
        new AIMessage({
          content: `Generated ${response.usecases.length} use cases for testing and validation`,
          name: 'QAGenerateUsecaseAgent',
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
        messages: [usecaseMessage],
        generatedUsecases: response.usecases,
      }

      // Save artifacts if usecases are successfully generated
      await saveArtifacts(updatedState, repositories, assistantRole)

      return updatedState
    },
    async (error) => {
      await logAssistantMessage(
        state,
        repositories,
        'Unable to generate test scenarios. This might be due to unclear requirements...',
        assistantRole,
      )

      throw new WorkflowTerminationError(error, 'generateUsecaseNode')
    },
  )
}
