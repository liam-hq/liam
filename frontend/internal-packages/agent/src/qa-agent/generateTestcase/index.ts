import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { ResultAsync } from 'neverthrow'
import { getConfigurable } from '../../chat/workflow/shared/getConfigurable'
import type { WorkflowState } from '../../chat/workflow/types'
import { logAssistantMessage } from '../../chat/workflow/utils/timelineLogger'
import { transformWorkflowStateToArtifact } from '../../chat/workflow/utils/transformWorkflowStateToArtifact'
import { withTimelineItemSync } from '../../chat/workflow/utils/withTimelineItemSync'
import type { Repositories } from '../../repositories'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import { removeReasoningFromMessages } from '../../utils/messageCleanup'
import { QAGenerateTestcaseAgent } from './agent'

/**
 * Save artifacts if workflow state contains artifact data
 */
async function saveArtifacts(
  state: WorkflowState,
  repositories: Repositories,
  assistantRole: Database['public']['Enums']['assistant_role_enum'],
): Promise<void> {
  if (!state.analyzedRequirements && !state.generatedTestcases) {
    return
  }

  const artifact = transformWorkflowStateToArtifact(state)
  const artifactResult = await repositories.schema.upsertArtifact({
    designSessionId: state.designSessionId,
    artifact,
  })

  if (artifactResult.isOk()) {
    await logAssistantMessage(
      state,
      repositories,
      'Your test cases have been saved and are ready for implementation',
      assistantRole,
    )
  } else {
    await logAssistantMessage(
      state,
      repositories,
      'Unable to save your test cases. Please try again or contact support...',
      assistantRole,
    )
  }
}

/**
 * Generate Testcase Node - QA Agent creates test cases
 * Performed by qaGenerateTestcaseAgent
 */
export async function generateTestcaseNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const assistantRole: Database['public']['Enums']['assistant_role_enum'] = 'qa'
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    throw new WorkflowTerminationError(
      configurableResult.error,
      'generateTestcaseNode',
    )
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(
    state,
    repositories,
    'Creating test scenarios to validate your database design...',
    assistantRole,
  )

  if (!state.analyzedRequirements) {
    const errorMessage =
      'No analyzed requirements found. Cannot generate test cases.'

    await logAssistantMessage(
      state,
      repositories,
      'Unable to generate test scenarios. This might be due to unclear requirements...',
      assistantRole,
    )

    throw new WorkflowTerminationError(
      new Error(errorMessage),
      'generateTestcaseNode',
    )
  }

  const qaAgent = new QAGenerateTestcaseAgent()

  // Remove reasoning field from AIMessages to avoid API issues
  // This prevents the "reasoning without required following item" error
  const cleanedMessages = removeReasoningFromMessages(state.messages)

  const testcaseResult = await ResultAsync.fromPromise(
    qaAgent.generate(cleanedMessages),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  return await testcaseResult.match(
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

      const testcaseMessage = await withTimelineItemSync(
        new AIMessage({
          content: `Generated ${response.testcases.length} test cases for testing and validation`,
          name: 'QAGenerateTestcaseAgent',
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
        messages: [testcaseMessage],
        generatedTestcases: response.testcases,
      }

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

      throw new WorkflowTerminationError(error, 'generateTestcaseNode')
    },
  )
}
