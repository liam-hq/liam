import type { MessageContent } from '@langchain/core/messages'

export function getContentString(content: MessageContent): string {
  // Return empty string for falsy values
  if (!content) return ''

  // Return string content directly
  if (typeof content === 'string') return content

  // Handle array content
  if (Array.isArray(content)) {
    const texts = content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map((c) => c.text)
    return texts.join(' ')
  }

  // For non-string truthy values, coerce to string
  return String(content)
}
