import type { WorkflowState } from '../../chat/workflow/types'
import { hasToolCalls } from '../../utils/hasToolCalls'

/**
 * Determines the next node based on whether the last message contains tool calls
 */
export const routeAfterDesignSchema = (
  state: WorkflowState,
): 'invokeSchemaDesignTool' | 'generateTestcase' => {
  const { messages } = state
  const lastMessage = messages[messages.length - 1]

  if (lastMessage && hasToolCalls(lastMessage)) {
    return 'invokeSchemaDesignTool'
  }

  return 'generateTestcase'
}
