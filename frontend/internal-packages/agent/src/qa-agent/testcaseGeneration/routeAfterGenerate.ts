import type { BaseMessage } from '@langchain/core/messages'
import { AIMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import type { testcaseAnnotation } from './testcaseAnnotation'

/**
 * Route after generateTestcaseNode based on whether tool calls are present
 * This is used within the testcase subgraph for retry logic
 */
export const routeAfterGenerate = (
  state: typeof testcaseAnnotation.State,
): 'invokeSaveTool' | typeof END => {
  const { messages } = state
  const lastMessage = messages[messages.length - 1]

  // Check if the last message has tool calls
  if (lastMessage && hasToolCalls(lastMessage)) {
    return 'invokeSaveTool'
  }

  // If no tool calls, generation is complete
  return END
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
