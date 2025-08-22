import type { BaseMessage } from '@langchain/core/messages'

/**
 * Determines whether the agent should continue to tools or end
 * This follows the React Agent pattern where the agent decides
 * whether to call tools or terminate
 */
export const shouldContinue = (state: { messages: BaseMessage[] }): string => {
  const { messages } = state
  const lastMessage = messages[messages.length - 1]

  if (
    lastMessage &&
    'tool_calls' in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0
  ) {
    return 'tools'
  }

  return 'END'
}
