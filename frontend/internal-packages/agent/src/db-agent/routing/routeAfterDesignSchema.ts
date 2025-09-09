import { WorkflowTerminationError } from '../../utils/errorHandling'
import { hasToolCalls } from '../../utils/hasToolCalls'
import type { DbAgentState } from '../shared/dbAgentAnnotation'

const MAX_DESIGN_RETRY_COUNT = 3

/**
 * Determines the next node based on whether the last message contains tool calls
 * and handles retry logic for failed schema design attempts
 */
export const routeAfterDesignSchema = (
  state: DbAgentState,
): 'invokeSchemaDesignTool' | 'generateTestcase' | 'designSchema' => {
  const { messages, designSchemaRetryCount } = state
  const lastMessage = messages[messages.length - 1]

  // If last message has tool calls, execute them (success path)
  if (lastMessage && hasToolCalls(lastMessage)) {
    return 'invokeSchemaDesignTool'
  }

  // No tool calls present, check if retry limit exceeded
  if (designSchemaRetryCount >= MAX_DESIGN_RETRY_COUNT) {
    throw new WorkflowTerminationError(
      new Error(
        `Failed to design schema with tool usage after ${MAX_DESIGN_RETRY_COUNT} attempts`,
      ),
      'routeAfterDesignSchema',
    )
  }

  // Retry design schema
  return 'designSchema'
}
