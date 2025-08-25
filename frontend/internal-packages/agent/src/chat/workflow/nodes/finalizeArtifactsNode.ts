import { type AIMessage, SystemMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import type { Database } from '@liam-hq/db'
import { ResultAsync } from 'neverthrow'
import { WorkflowTerminationError } from '../../../shared/errorHandling'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'
import { withTimelineItemSync } from '../utils/withTimelineItemSync'

/**
 * Generate a workflow summary using LLM
 */
function generateWorkflowSummary(
  state: WorkflowState,
): ResultAsync<AIMessage, Error> {
  const llm = new ChatOpenAI({
    model: 'gpt-5-nano',
    reasoning: { effort: 'minimal' },
  })

  const summaryPrompt = `Based on the following workflow conversation about database design, provide a concise summary of what was accomplished:

Please summarize:
- The main user requirements that were analyzed
- Key database design decisions that were made
- Any schemas, tables, or data structures that were created or modified
- Important outcomes or results from this workflow

Keep the summary informative but concise, focusing on the key achievements and decisions made during this database design session.`

  return ResultAsync.fromPromise(
    llm.invoke([new SystemMessage(summaryPrompt), ...state.messages]),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )
}

/**
 * Finalize Artifacts Node - Generate & Save Artifacts and Final Summary
 * Performed by dbAgentArtifactGen
 * Note: Error handling is now done immediately at error occurrence, not here
 */
export async function finalizeArtifactsNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    throw new WorkflowTerminationError(
      configurableResult.error,
      'finalizeArtifactsNode',
    )
  }

  const { repositories } = configurableResult.value

  const assistantRole: Database['public']['Enums']['assistant_role_enum'] = 'db'

  await logAssistantMessage(
    state,
    repositories,
    'Generating workflow summary...',
    assistantRole,
  )

  const syncSummary = (message: AIMessage) =>
    ResultAsync.fromPromise(
      withTimelineItemSync(message, {
        designSessionId: state.designSessionId,
        organizationId: state.organizationId || '',
        userId: state.userId,
        repositories,
        assistantRole,
      }),
      (error) => (error instanceof Error ? error : new Error(String(error))),
    )

  const summaryResult =
    await generateWorkflowSummary(state).andThen(syncSummary)

  return summaryResult.match(
    (summaryMessage) => ({
      ...state,
      messages: [summaryMessage],
    }),
    async (error) => {
      await logAssistantMessage(
        state,
        repositories,
        `Unable to generate workflow summary at this time: ${error.message}`,
        assistantRole,
      )

      throw new WorkflowTerminationError(error, 'finalizeArtifactsNode')
    },
  )
}
