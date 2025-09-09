import { ToolMessage } from '@langchain/core/messages'
import type { DbAgentState } from '../shared/dbAgentAnnotation'

/**
 * Check if the last message is a successful tool execution
 */
const isSuccessfulToolExecution = (message: unknown): boolean => {
  if (!(message instanceof ToolMessage)) {
    return false
  }

  // Check if it's from schemaDesignTool and successful
  return (
    message.name === 'schemaDesignTool' &&
    typeof message.content === 'string' &&
    message.content.includes('Schema successfully updated')
  )
}

/**
 * Determines the next node after invokeSchemaDesignTool execution
 * Routes to END if tool execution was successful, otherwise back to designSchema
 */
export const routeAfterInvokeSchemaDesignTool = (
  state: DbAgentState,
): 'END' | 'designSchema' => {
  const { messages } = state
  const lastMessage = messages[messages.length - 1]

  // If tool execution was successful, end the workflow
  if (lastMessage && isSuccessfulToolExecution(lastMessage)) {
    return 'END'
  }

  // If tool execution failed or returned an error, retry
  return 'designSchema'
}
