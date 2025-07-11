import type { BaseMessage } from '@langchain/core/messages'

/**
 * Convert array of BaseMessage objects to formatted chat history string
 * @param messages - Array of BaseMessage objects
 * @returns Formatted chat history string or default message if empty
 */
export const formatMessagesToHistory = (messages: BaseMessage[]): string => {
  if (messages.length === 0) {
    return 'No previous conversation.'
  }

  return messages
    .map((message) => {
      const prefix = message._getType() === 'ai' ? 'Assistant' : 'User'
      return `${prefix}: ${message.content}`
    })
    .join('\n')
}
