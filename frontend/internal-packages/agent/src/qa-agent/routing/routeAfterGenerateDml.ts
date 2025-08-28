import type { BaseMessage } from '@langchain/core/messages'
import { AIMessage } from '@langchain/core/messages'
import type { WorkflowState } from '../../chat/workflow/types'

/**
 * Route after generateDml node based on whether tool calls are present
 */
export const routeAfterGenerateDml = (
  state: WorkflowState,
): 'invokeSaveDmlTool' | 'validateSchema' => {
  const { messages } = state
  const lastMessage = messages[messages.length - 1]

  // Check if the last message has tool calls
  if (lastMessage && hasToolCalls(lastMessage)) {
    return 'invokeSaveDmlTool'
  }

  // Default to validation if no tool calls
  return 'validateSchema'
}

/**
 * Check if a message contains tool calls
 */
const hasToolCalls = (message: BaseMessage): boolean => {
  return (
    message instanceof AIMessage &&
    'tool_calls' in message &&
    Array.isArray(message.tool_calls) &&
    message.tool_calls.length > 0
  )
}
