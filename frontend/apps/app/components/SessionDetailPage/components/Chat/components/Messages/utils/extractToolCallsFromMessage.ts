import type { Message } from '@langchain/langgraph-sdk'
import * as v from 'valibot'
import { additionalKwargsSchema, type ToolCalls } from '../schema'

export function extractToolCallsFromMessage(message: Message): ToolCalls {
  const parsed = v.safeParse(additionalKwargsSchema, message.additional_kwargs)
  if (!parsed.success || parsed.output.tool_calls === undefined) return []

  return parsed.output.tool_calls
}
