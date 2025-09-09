import type { AIMessage } from '@langchain/core/messages'
import * as v from 'valibot'
import { type ToolCalls, toolCallsSchema } from '../schema'

export function extractToolCallsFromMessage(message: AIMessage): ToolCalls {
  const parsed = v.safeParse(toolCallsSchema, message.tool_calls)
  if (!parsed.success || parsed.output === undefined) return []

  return parsed.output
}
