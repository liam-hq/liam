import { AIMessage, SystemMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import type { Database } from '@liam-hq/db'
import { ResultAsync } from 'neverthrow'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'

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
    'Searching for relevant information...',
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
      await logAssistantMessage(
        state,
        repositories,
        'Web search completed',
        assistantRole,
      )

      // Extract the search results content
      const searchContent =
        typeof result.content === 'string'
          ? result.content
          : JSON.stringify(result.content)

      return {
        ...state,
        messages: [
          ...state.messages,
          new AIMessage({
            content: `Web Search Results:\n${searchContent}`,
            name: 'WebSearchAgent',
          }),
        ],
        webSearchResults: searchContent,
        error: undefined, // Clear error on success
      }
    },
    async (_error) => {
      await logAssistantMessage(
        state,
        repositories,
        'Error occurred during web search',
        assistantRole,
        true,
      )

      // Don't fail the entire workflow if web search fails
      // Just continue without the search results
      return {
        ...state,
        messages: [
          ...state.messages,
          new AIMessage({
            content:
              'Web search was skipped due to an error, proceeding with analysis.',
            name: 'WebSearchAgent',
          }),
        ],
        webSearchResults: undefined,
        retryCount: {
          ...state.retryCount,
          ['webSearchNode']: retryCount + 1,
        },
      }
    },
  )
}
