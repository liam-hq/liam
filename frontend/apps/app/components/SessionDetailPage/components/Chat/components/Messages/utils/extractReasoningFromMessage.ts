import type { BaseMessage } from '@langchain/core/messages'
import * as v from 'valibot'
import { additionalKwargsSchema } from '../../../../../schema'

export function extractReasoningFromMessage(
  message: BaseMessage,
): string | null {
  const parsed = v.safeParse(additionalKwargsSchema, message.additional_kwargs)
  if (!parsed.success) return null
  if (!parsed.output?.reasoning) return null

  const { summary } = parsed.output.reasoning
  return summary
    .map((s: { text: string }) => s.text || '')
    .filter(Boolean)
    .join('\n\n')
}
