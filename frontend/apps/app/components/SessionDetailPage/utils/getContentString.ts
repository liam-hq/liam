import type { MessageContent } from '@langchain/core/messages'

export function getContentString(content: MessageContent): string {
  if (typeof content === 'string' || !content) return content
  const texts = content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
  return texts.join(' ')
}
