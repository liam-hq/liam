import {
  AIMessage,
  type BaseMessage,
  isToolMessage,
} from '@langchain/core/messages'

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
  return /\berror\b/i.test(content)
}

/**
 * Filters out ToolMessages that don't have corresponding AI messages with tool calls
 * This prevents "No tool call found" errors from OpenAI API
 */
export const filterOrphanedToolMessages = (
  messages: BaseMessage[],
): BaseMessage[] => {
  const toolCallIds = new Set<string>()
  const filteredMessages: BaseMessage[] = []

  for (const message of messages) {
    if (message instanceof AIMessage && message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.id) {
          toolCallIds.add(toolCall.id)
        }
      }
    }
  }

  for (const message of messages) {
    if (isToolMessage(message)) {
      if (message.tool_call_id && toolCallIds.has(message.tool_call_id)) {
        filteredMessages.push(message)
      }
    } else {
      filteredMessages.push(message)
    }
  }

  return filteredMessages
}

/**
 * Validates message history for tool call consistency
 * Returns validation errors if any issues are found
 */
export const validateToolCallConsistency = (
  messages: BaseMessage[],
): string[] => {
  const errors: string[] = []
  const toolCallIds = new Set<string>()
  const toolResponseIds = new Set<string>()

  for (const message of messages) {
    if (message instanceof AIMessage && message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.id) {
          toolCallIds.add(toolCall.id)
        }
      }
    } else if (isToolMessage(message) && message.tool_call_id) {
      toolResponseIds.add(message.tool_call_id)
    }
  }

  for (const responseId of toolResponseIds) {
    if (!toolCallIds.has(responseId)) {
      errors.push(
        `ToolMessage with call_id ${responseId} has no corresponding tool call`,
      )
    }
  }

  return errors
}
