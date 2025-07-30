import type { BaseMessage } from '@langchain/core/messages'
import type { WorkflowState } from '../../chat/workflow/types'

/**
 * Determines the next node based on error states, retry limits, schema validity, and tool calls
 */
export const routeAfterDesignSchema = (
  state: WorkflowState,
): 'invokeSchemaDesignTool' | 'executeDDL' => {
  const { messages, error, retryCount, schemaData } = state
  const lastMessage = messages[messages.length - 1]

  if (error) {
    return 'executeDDL'
  }

  const currentRetryCount = retryCount['designSchema'] ?? 0
  const MAX_RETRIES = 3
  if (currentRetryCount >= MAX_RETRIES) {
    return 'executeDDL'
  }

  if (
    schemaData &&
    Object.keys(schemaData.tables).length === 0 &&
    currentRetryCount > 0
  ) {
    return 'executeDDL'
  }

  if (lastMessage && hasToolCalls(lastMessage)) {
    return 'invokeSchemaDesignTool'
  }

  return 'executeDDL'
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
