import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { ResultAsync } from 'neverthrow'
import { WebSearchAgent } from '../../../langchain/agents'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'
import { withTimelineItemSync } from '../utils/withTimelineItemSync'

/**
 * Web Search Node - Initial Research
 * Searches web for context about the user's requirements before analysis
 */
export async function webSearchNode(
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
    'Researching best practices for your specific database needs...',
    assistantRole,
  )

  const webSearchAgent = new WebSearchAgent()

  const retryCount = state.retryCount['webSearchNode'] ?? 0

  const searchResult = await ResultAsync.fromPromise(
    webSearchAgent.generate(state.messages),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  return searchResult.match(
    async (searchContent) => {
      const searchMessage = await withTimelineItemSync(
        new AIMessage({
          content: `Web Search Results:\n${searchContent}`,
          name: 'WebSearchAgent',
        }),
        {
          designSessionId: state.designSessionId,
          organizationId: state.organizationId || '',
          userId: state.userId,
          repositories,
          assistantRole,
        },
      )

      return {
        ...state,
        messages: [...state.messages, searchMessage],
        webSearchResults: searchContent,
        error: undefined, // Clear error on success
      }
    },
    async (_error) => {
      await logAssistantMessage(
        state,
        repositories,
        'Web search temporarily unavailable. Proceeding with built-in best practices...',
        assistantRole,
      )

      // Don't fail the entire workflow if web search fails
      // Just continue without the search results
      const errorMessage = await withTimelineItemSync(
        new AIMessage({
          content:
            'Web search was skipped due to an error, proceeding with analysis.',
          name: 'WebSearchAgent',
        }),
        {
          designSessionId: state.designSessionId,
          organizationId: state.organizationId || '',
          userId: state.userId,
          repositories,
          assistantRole,
        },
      )

      return {
        ...state,
        messages: [...state.messages, errorMessage],
        webSearchResults: undefined,
        retryCount: {
          ...state.retryCount,
          ['webSearchNode']: retryCount + 1,
        },
      }
    },
  )
}
