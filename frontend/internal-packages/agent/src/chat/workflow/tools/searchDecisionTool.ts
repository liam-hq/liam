import { tool } from '@langchain/core/tools'
import * as v from 'valibot'

// Schema for search decision result using valibot
const SearchDecisionResultSchema = v.object({
  needsSearch: v.boolean(),
  reason: v.string(),
  needsIndustryKnowledge: v.boolean(),
  searchQueries: v.array(v.string()),
  urls: v.array(v.string()),
})

export type SearchDecisionResult = v.InferOutput<
  typeof SearchDecisionResultSchema
>

// JSON Schema for LangChain tool compatibility
const searchDecisionJsonSchema = {
  type: 'object',
  properties: {
    needsSearch: { type: 'boolean' },
    reason: { type: 'string' },
    needsIndustryKnowledge: { type: 'boolean' },
    searchQueries: {
      type: 'array',
      items: { type: 'string' },
      description: 'Specific search queries to investigate the user request',
    },
    urls: {
      type: 'array',
      items: { type: 'string' },
      description: 'URLs mentioned by the user that need to be researched',
    },
  },
  required: [
    'needsSearch',
    'reason',
    'needsIndustryKnowledge',
    'searchQueries',
    'urls',
  ],
} as const

/**
 * Tool for making search decisions (structured output)
 * Determines if web search is needed based on user input
 */
export const searchDecisionTool = tool(
  async (_unusedInput: unknown) => {
    // This parameter is unused and exists only for compatibility with the tool's interface.
    return 'Search decision analysis completed'
  },
  {
    name: 'SearchDecisionResult',
    description: `Tool to return structured search analysis results. Please determine the necessity of search and provide specific search guidance:

1. Does the user mention any URLs that need to be researched?
2. Does the request require current industry knowledge, best practices, or external information?

Additionally, provide:
- searchQueries: Specific search terms or questions to investigate (e.g., "PostgreSQL medical staff table schema", "React admin dashboard patterns")
- urls: Extract any URLs mentioned by the user that need to be researched

For general database design patterns that are well-established, search may not be necessary.
If URLs are mentioned, search is needed to gather information from those sources.
If the request involves specific technologies, frameworks, or industry-specific requirements, search may help.`,
    schema: searchDecisionJsonSchema,
  },
)
