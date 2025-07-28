import { SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { ResultAsync } from 'neverthrow'

type SearchOptions = {
  needsIndustryKnowledge?: boolean
  searchQueries?: string[]
  urls?: string[]
}

/**
 * Pure web search tool
 * Performs web search with customizable search strategy
 */
export async function webSearchTool(
  options: SearchOptions = {},
): Promise<string | undefined> {
  const {
    needsIndustryKnowledge = false,
    searchQueries = [],
    urls = [],
  } = options

  // Create LLM with web search tool binding
  const webSearchToolConfig = { type: 'web_search_preview' } as const
  const searchLlm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.3,
  }).bindTools([webSearchToolConfig])

  // Build search prompt focused on specific queries and URLs
  let searchPrompt =
    'Search and extract factual information only. Do not provide answers, analysis, or recommendations.'

  // Add specific search queries if provided
  if (searchQueries.length > 0) {
    searchPrompt += `\n\nSearch for the following specific queries:\n${searchQueries.map((query) => `- ${query}`).join('\n')}`
  }

  // Add specific URLs if provided
  if (urls.length > 0) {
    searchPrompt += `\n\nExtract content and information from these specific URLs:\n${urls.map((url) => `- ${url}`).join('\n')}`
  }

  // Fallback to general guidance if no specific queries/URLs
  if (searchQueries.length === 0 && urls.length === 0) {
    // Note: This handles cases where only needsIndustryKnowledge is true
    // without specific search queries or URLs provided

    if (needsIndustryKnowledge) {
      searchPrompt +=
        ' Find current industry documentation, specifications, and factual references related to the technologies mentioned.'
    }
  }

  searchPrompt +=
    '\n\nReturn only the raw information found, not interpretations or solutions.'

  const searchResult = await ResultAsync.fromPromise(
    searchLlm.invoke([new SystemMessage(searchPrompt)]),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  return searchResult.match(
    (result) => {
      return typeof result.content === 'string'
        ? result.content
        : JSON.stringify(result.content)
    },
    (_error) => {
      // Return undefined on search failure
      return undefined
    },
  )
}
