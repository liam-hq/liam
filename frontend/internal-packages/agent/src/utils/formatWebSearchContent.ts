import { fromThrowable } from '@liam-hq/neverthrow'
import * as v from 'valibot'

/**
 * OpenAI Web Search API response content structure validation
 *
 * Note: The official documentation shows 'output_text' as the type, but in practice
 * we've observed both 'output_text' and 'text' being used. This schema accommodates both.
 *
 * Based on:
 * - Official docs: https://platform.openai.com/docs/guides/tools-web-search
 * - Actual API responses observed in production logs
 */
const UrlCitationSchema = v.object({
  type: v.literal('url_citation'),
  start_index: v.number(),
  end_index: v.number(),
  url: v.string(),
  title: v.string(),
})

const WebSearchContentItemSchema = v.object({
  // Accept both 'output_text' (documented) and 'text' (observed in practice)
  type: v.union([v.literal('output_text'), v.literal('text')]),
  text: v.string(),
  annotations: v.optional(v.array(UrlCitationSchema)),
})

const WebSearchContentSchema = v.array(WebSearchContentItemSchema)

type WebSearchContentItem = v.InferOutput<typeof WebSearchContentItemSchema>

/**
 * Formats OpenAI Web Search result content for better readability in timeline
 *
 * Transforms the API response structure from raw JSON to readable text:
 *
 * Input (documented format):
 * [{"type":"output_text","text":"content...","annotations":[...]}]
 *
 * Input (observed format):
 * [{"type":"text","text":"content..."}]
 *
 * Output: Clean, readable markdown-formatted text with citations
 */
export const formatWebSearchContent = (content: unknown): string => {
  const parseResult = v.safeParse(WebSearchContentSchema, content)

  if (parseResult.success) {
    return formatValidContent(parseResult.output)
  }

  // Fallback for unexpected structures (should not happen with official API)
  return formatUnknownContent(content)
}

/**
 * Formats validated web search content array
 */
const formatValidContent = (items: WebSearchContentItem[]): string => {
  if (items.length === 0) {
    return ''
  }

  const formattedItems = items.map((item, index) => {
    const formatted = formatContentItem(item)
    return items.length > 1
      ? `## Search Result ${index + 1}\n\n${formatted}`
      : formatted
  })

  return formattedItems.join('\n\n---\n\n')
}

/**
 * Formats a single validated web search content item
 */
const formatContentItem = (item: WebSearchContentItem): string => {
  const parts = [item.text]

  // Format annotations as markdown links
  if (item.annotations && item.annotations.length > 0) {
    const citations = item.annotations.map(
      (annotation) => `[${annotation.title}](${annotation.url})`,
    )
    parts.push('', ...citations)
  }

  return parts.join('\n')
}

/**
 * Fallback formatting for unknown content structures
 */
const formatUnknownContent = (content: unknown): string => {
  if (content === null || content === undefined) {
    return 'No search results available'
  }

  if (typeof content === 'object') {
    return fromThrowable(() => JSON.stringify(content, null, 2))().match(
      (jsonString) => `\`\`\`json\n${jsonString}\n\`\`\``,
      () => String(content),
    )
  }

  return String(content)
}
