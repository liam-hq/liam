import { type BaseMessage, isToolMessage } from '@langchain/core/messages'

/**
 * Checks if a ToolMessage contains an error by examining its text content
 * @param message - The message to check
 * @returns true if the message is a ToolMessage and contains an error
 */
export const isToolMessageError = (message: BaseMessage): boolean => {
  return isToolMessage(message) && isMessageContentError(message.text)
}

/**
 * Checks if a message text content indicates an error
 * @param content - The message content to check
 * @returns true if the content contains error indicators
 */
export const isMessageContentError = (content: string): boolean => {
  return /\berrors?\b/i.test(content)
}
