import type { BaseMessage } from '@langchain/core/messages'

const formatStreamingMessage = (
  message: BaseMessage,
  newContent: string,
  isFirstChunk: boolean,
): string => {
  const messageType = message._getType().toLowerCase()

  switch (messageType) {
    case 'human':
      return isFirstChunk ? `\n\n> ${newContent}` : newContent
    case 'ai':
      return formatAIMessage(message, newContent, isFirstChunk)
    case 'tool':
      return formatToolMessage(message, newContent, isFirstChunk)
    default:
      return isFirstChunk ? `${messageType}: ${newContent}` : newContent
  }
}

const formatAIMessage = (
  message: BaseMessage,
  newContent: string,
  isFirstChunk: boolean,
): string => {
  const name = 'name' in message && message.name ? ` (${message.name})` : ''
  return isFirstChunk ? `\n\n⏺ ${name}:\n\n${newContent}` : newContent
}

const formatToolMessage = (
  message: BaseMessage,
  newContent: string,
  isFirstChunk: boolean,
): string => {
  const toolName = 'name' in message && message.name ? message.name : 'unknown'
  return isFirstChunk ? `  ⎿ ${toolName}: ${newContent}` : newContent
}

export { formatStreamingMessage }
