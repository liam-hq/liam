import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import type { Database } from '@liam-hq/db'
import { Result, ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import type { Repositories } from '../../../repositories'
import { getConfigurable } from '../shared/getConfigurable'
import {
  type SearchDecisionResult,
  searchDecisionTool,
  webSearchTool,
} from '../tools'

/**
 * Extract text parts from parsed JSON array
 */
function extractTextFromParsedArray(parsed: unknown[]): string[] {
  const textParts: string[] = []
  for (const item of parsed) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'type' in item &&
      'text' in item
    ) {
      const itemRecord: Record<string, unknown> = item
      if (
        itemRecord['type'] === 'text' &&
        typeof itemRecord['text'] === 'string'
      ) {
        textParts.push(String(itemRecord['text']))
      }
    }
  }
  return textParts
}

/**
 * Format search results from JSON to markdown
 */
function formatSearchResults(searchResults: string): string {
  const parseResult = Result.fromThrowable(
    () => JSON.parse(searchResults),
    () => new Error('JSON parsing failed'),
  )()

  return parseResult.match(
    (parsed) => {
      if (Array.isArray(parsed)) {
        const textParts = extractTextFromParsedArray(parsed)
        if (textParts.length > 0) {
          return `## Retrieved Information\n\n${textParts.join('\n\n')}`
        }
      }
      return `## Retrieved Information\n\n${searchResults}`
    },
    () => `## Retrieved Information\n\n${searchResults}`,
  )
}

// Schema for validating tool results
const searchDecisionResultSchema = v.object({
  needsSearch: v.boolean(),
  reason: v.string(),
  hasUrls: v.boolean(),
  needsIndustryKnowledge: v.boolean(),
  searchQueries: v.array(v.string()),
  urls: v.array(v.string()),
})

import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'
import { withTimelineItemSync } from '../utils/withTimelineItemSync'

type ToolProcessingResult = {
  searchDecision: SearchDecisionResult
  consolidatedMessage: AIMessage | undefined
}

/**
 * Execute web search and create timeline message
 */
async function executeWebSearch(
  state: WorkflowState,
  repositories: Repositories,
  assistantRole: Database['public']['Enums']['assistant_role_enum'],
  searchDecision: SearchDecisionResult | undefined,
): Promise<{
  consolidatedMessage: AIMessage | undefined
}> {
  // Log specific URLs being researched if they exist
  if (searchDecision?.urls && searchDecision.urls.length > 0) {
    const urlList = searchDecision.urls.map((url) => `- ${url}`).join('\n')
    await logAssistantMessage(
      state,
      repositories,
      `Researching the following URLs:\n${urlList}`,
      assistantRole,
    )
  } else {
    await logAssistantMessage(
      state,
      repositories,
      'Performing web search...',
      assistantRole,
    )
  }

  const webSearchResults = await webSearchTool({
    hasUrls: Boolean(searchDecision?.urls && searchDecision.urls.length > 0),
    needsIndustryKnowledge: Boolean(
      searchDecision?.searchQueries && searchDecision.searchQueries.length > 0,
    ),
    searchQueries: searchDecision?.searchQueries || [],
    urls: searchDecision?.urls || [],
  })

  let consolidatedMessage: AIMessage | undefined = undefined
  if (webSearchResults) {
    // Create consolidated message with formatted search results
    const formattedResults = formatSearchResults(webSearchResults)

    consolidatedMessage = await withTimelineItemSync(
      new AIMessage({
        content: formattedResults,
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
  }

  return { consolidatedMessage }
}

/**
 * Process tool response and handle search decision logic
 */
async function processToolResponse(
  response: AIMessage,
  state: WorkflowState,
  repositories: Repositories,
  assistantRole: Database['public']['Enums']['assistant_role_enum'],
): Promise<ToolProcessingResult> {
  let searchDecision: SearchDecisionResult | undefined = undefined
  let consolidatedMessage: AIMessage | undefined = undefined

  // Process tool calls
  if (response.tool_calls && response.tool_calls.length > 0) {
    for (const toolCall of response.tool_calls) {
      if (toolCall.name === 'SearchDecisionResult') {
        // Use structured output tool result directly
        const parseResult = v.safeParse(
          searchDecisionResultSchema,
          toolCall.args,
        )
        if (parseResult.success) {
          searchDecision = parseResult.output
        }
      } else if (toolCall.name === 'web_search_preview') {
        const searchResult = await executeWebSearch(
          state,
          repositories,
          assistantRole,
          searchDecision,
        )
        consolidatedMessage = searchResult.consolidatedMessage
      }
    }
  }

  // If no decision was made, use fallback
  if (!searchDecision) {
    searchDecision = {
      needsSearch: true,
      reason: 'No decision tool called, defaulting to search',
      hasUrls: false,
      needsIndustryKnowledge: true,
      searchQueries: [],
      urls: [],
    }
  }

  return {
    searchDecision,
    consolidatedMessage,
  }
}

/**
 * Analyze Search Requirement Node
 * Uses structured tools to analyze requirements and conditionally perform web search
 */
export async function analyzeSearchRequirementNode(
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

  // Create LLM with search decision tool and web search capability
  const webSearchToolConfig = { type: 'web_search_preview' } as const
  const llmWithTools = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.1,
  }).bindTools([searchDecisionTool, webSearchToolConfig])

  const prompt = `Analyze the user's request and determine if web search is needed.

User's latest message: "${state.messages[state.messages.length - 1]?.content || ''}"

Use the SearchDecisionResult tool to analyze:
1. Does the user mention any URLs that need to be researched?
2. Does the request require current industry knowledge, best practices, or external information?

Consider:
- If URLs are mentioned, search is needed to gather information from those sources
- If the request involves specific technologies, frameworks, or industry-specific requirements, search may help
- For general database design patterns that are well-established, search may not be necessary`

  const result = await ResultAsync.fromPromise(
    llmWithTools.invoke([...state.messages, { role: 'user', content: prompt }]),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  return result.match(
    async (response) => {
      const processedResult = await processToolResponse(
        response,
        state,
        repositories,
        assistantRole,
      )

      // If search is needed but not performed by LLM, execute it now
      let finalConsolidatedMessage = processedResult.consolidatedMessage

      if (
        processedResult.searchDecision.needsSearch &&
        !processedResult.consolidatedMessage
      ) {
        const searchResult = await executeWebSearch(
          state,
          repositories,
          assistantRole,
          processedResult.searchDecision,
        )
        finalConsolidatedMessage = searchResult.consolidatedMessage
      }

      // Add consolidated search message to messages for downstream nodes
      const finalMessages = finalConsolidatedMessage
        ? [...state.messages, finalConsolidatedMessage]
        : state.messages

      return {
        ...state,
        messages: finalMessages,
        error: undefined,
      }
    },
    async (_error) => {
      // On failure, default to performing search
      const defaultDecision: SearchDecisionResult = {
        needsSearch: true,
        reason:
          'Tool invocation failed, defaulting to search for comprehensive results',
        hasUrls: false,
        needsIndustryKnowledge: true,
        searchQueries: [],
        urls: [],
      }

      await logAssistantMessage(
        state,
        repositories,
        'Analysis failed, performing fallback web search...',
        assistantRole,
      )

      const searchResult = await executeWebSearch(
        state,
        repositories,
        assistantRole,
        defaultDecision,
      )
      const consolidatedMessage = searchResult.consolidatedMessage

      const finalMessages = consolidatedMessage
        ? [...state.messages, consolidatedMessage]
        : state.messages

      return {
        ...state,
        messages: finalMessages,
        error: undefined, // Don't propagate error, continue with default
      }
    },
  )
}
