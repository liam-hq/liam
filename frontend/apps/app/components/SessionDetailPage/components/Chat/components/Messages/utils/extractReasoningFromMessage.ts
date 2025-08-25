import type { Message } from '@langchain/langgraph-sdk'
import * as v from 'valibot'

const summaryItemSchema = v.object({
  type: v.literal('summary_text'),
  text: v.string(),
  index: v.number(),
})

const reasoningSchema = v.object({
  id: v.string(),
  type: v.literal('reasoning'),
  summary: v.array(summaryItemSchema),
})

const additionalKwargsSchema = v.object({
  reasoning: v.optional(reasoningSchema),
})

export function extractReasoningFromMessage(message: Message): string | null {
  const parsed = v.safeParse(additionalKwargsSchema, message.additional_kwargs)
  if (!parsed.success || !parsed.output.reasoning) return null

  const { summary } = parsed.output.reasoning
  return summary
    .map((s) => s.text || '')
    .filter(Boolean)
    .join('\n\n')
}
