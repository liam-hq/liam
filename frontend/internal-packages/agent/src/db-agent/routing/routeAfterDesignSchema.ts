import type { BaseMessage } from '@langchain/core/messages'
import type { WorkflowState } from '../../chat/workflow/types'

/**
 * Determines the next node based on whether the last message contains tool calls
 */
export const routeAfterDesignSchema = (
  state: WorkflowState,
): 'invokeSchemaDesignTool' | 'generateUsecase' => {
  const { messages } = state
  const lastMessage = messages[messages.length - 1]

  if (lastMessage && hasToolCalls(lastMessage)) {
    return 'invokeSchemaDesignTool'
  }

  return 'generateUsecase'
}

/**
 * Checks if a message contains tool calls
 * Enhanced to handle edge cases that cause false negatives
 */
const hasToolCalls = (message: BaseMessage): boolean => {
  if (
    'tool_calls' in message &&
    Array.isArray(message.tool_calls) &&
    message.tool_calls.length > 0
  ) {
    return true
  }

  if (
    'additional_kwargs' in message &&
    message.additional_kwargs &&
    'tool_calls' in message.additional_kwargs &&
    Array.isArray(message.additional_kwargs.tool_calls) &&
    message.additional_kwargs.tool_calls.length > 0
  ) {
    return true
  }

  return false
}
