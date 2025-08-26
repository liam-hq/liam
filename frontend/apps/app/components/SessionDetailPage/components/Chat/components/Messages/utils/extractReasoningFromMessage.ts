import type { Message } from '@langchain/langgraph-sdk'
import * as v from 'valibot'
import { additionalKwargsSchema } from '../schema'

export function extractReasoningFromMessage(message: Message): string | null {
  const parsed = v.safeParse(additionalKwargsSchema, message.additional_kwargs)
  if (!parsed.success || !parsed.output.reasoning) return null

  const { summary } = parsed.output.reasoning
  return summary
    .map((s) => s.text || '')
    .filter(Boolean)
    .join('\n\n')
}
