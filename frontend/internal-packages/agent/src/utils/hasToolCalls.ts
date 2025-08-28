import type { BaseMessage } from '@langchain/core/messages'

/**
 * Check if a message contains tool calls
 * @param message - The BaseMessage to check
 * @returns true if the message has non-empty tool_calls array
 */
export const hasToolCalls = (message: BaseMessage): boolean => {
  return (
    'tool_calls' in message &&
    Array.isArray(message.tool_calls) &&
    message.tool_calls.length > 0
  )
}
