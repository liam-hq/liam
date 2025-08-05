import type { BaseMessage } from '@langchain/core/messages'
import type { WorkflowState } from '../../chat/workflow/types'

/**
 * Determines the next node based on tool calls in the AI response
 * AI makes the decision about tool usage based on context in prompts
 * Forces tool usage when schema is empty (no tables exist)
 */
export const routeAfterDesignSchema = (
  state: WorkflowState,
): 'invokeSchemaDesignTool' | 'generateUsecase' => {
  const { messages, schemaData } = state
  const lastMessage = messages[messages.length - 1]

  const isEmptySchema = Object.keys(schemaData.tables).length === 0
  if (isEmptySchema) {
    return 'invokeSchemaDesignTool'
  }

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
