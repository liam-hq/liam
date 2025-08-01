import { AIMessage, SystemMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import type { Database } from '@liam-hq/db'
import { ResultAsync } from 'neverthrow'
import { WorkflowTerminationError } from '../../../shared/errorHandling'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { formatWebSearchContent } from '../utils/formatWebSearchContent'
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
    throw new WorkflowTerminationError(
      configurableResult.error,
      'webSearchNode',
    )
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(
    state,
    repositories,
    'Researching best practices for your specific database needs...',
    assistantRole,
  )

  // Create LLM with web search tool binding
  // Note: web_search_preview is an OpenAI-specific tool type
  const webSearchTool = { type: 'web_search_preview' } as const
  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.3,
  }).bindTools([webSearchTool])

  const retryCount = state.retryCount['webSearchNode'] ?? 0

  // Create a search query based on user input
  const searchPrompt = `Based on the following user request about database design, perform a web search to gather relevant information about best practices, patterns, and considerations:

Search for information about:
- Database design patterns related to the request
- Best practices for the mentioned use case
- Common pitfalls to avoid
- Industry standards or conventions

Provide a concise summary of the most relevant findings.`

  const searchResult = await ResultAsync.fromPromise(
    llm.invoke([new SystemMessage(searchPrompt), ...state.messages]),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  return searchResult.match(
    async (result) => {
      // Extract and format the search results content
      const searchContent = formatWebSearchContent(result.content)

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
        messages: [searchMessage],
        webSearchResults: searchContent,
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
        messages: [errorMessage],
        webSearchResults: undefined,
        retryCount: {
          ...state.retryCount,
          ['webSearchNode']: retryCount + 1,
        },
      }
    },
  )
}
