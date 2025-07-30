import type { BaseMessage } from '@langchain/core/messages'
import type { WorkflowState } from '../../chat/workflow/types'

/**
 * Determines the next node based on whether the last message contains tool calls
 * Also checks for error state to prevent routing when errors occur
 */
export const routeAfterDesignSchema = (
  state: WorkflowState,
): 'invokeSchemaDesignTool' | 'generateUsecase' => {
  if (state.error) {
    return 'generateUsecase'
  }

  const { messages } = state
  const lastMessage = messages[messages.length - 1]

  if (lastMessage && hasToolCalls(lastMessage)) {
    return 'invokeSchemaDesignTool'
  }

  return 'generateUsecase'
}

/**
 * Checks if a message contains tool calls
 */
const hasToolCalls = (message: BaseMessage): boolean => {
  return (
    'tool_calls' in message &&
    Array.isArray(message.tool_calls) &&
    message.tool_calls.length > 0
  )
}
