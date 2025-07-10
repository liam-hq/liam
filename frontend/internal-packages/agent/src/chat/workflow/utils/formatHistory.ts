import type { BaseMessage } from '@langchain/core/messages'

/**
 * Format messages into chat history string for backward compatibility with existing agents
 * @param messages - Array of BaseMessage objects
 * @returns Formatted chat history string
 */
export const formatHistory = (messages: BaseMessage[]): string => {
  return messages
    .map((msg) => {
      const role = msg._getType() === 'human' ? 'User' : 'Assistant'
      return `${role}: ${msg.content}`
    })
    .join('\n')
}
