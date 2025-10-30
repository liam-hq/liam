import { END } from '@langchain/langgraph'
import { hasToolCalls } from '../../utils/hasToolCalls'
import type { DbAgentState } from '../shared/dbAgentAnnotation'

/**
 * Determines the next node based on whether the last message contains tool calls
 *
 * This routing function follows the ReAct pattern where the agent returns to
 * this decision point after each tool execution, allowing for multi-step schema design.
 *
 * Infinite loop prevention is handled by LangGraph's recursionLimit (default: 25).
 */
export const routeAfterDesignSchema = (
  state: DbAgentState,
): 'invokeCreateMigrationTool' | 'designSchema' | typeof END => {
  const { messages } = state
  const lastMessage = messages[messages.length - 1]

  // If last message has tool calls, execute them
  if (lastMessage && hasToolCalls(lastMessage)) {
    return 'invokeCreateMigrationTool'
  }

  // No tool calls - AI has decided schema design is complete
  return END
}
