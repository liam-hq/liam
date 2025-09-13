import { type BaseMessage, ToolMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

/**
 * Route after validation based on test execution results
 * Determines whether to attempt auto-healing or end the workflow
 */
export const routeAfterValidation = (
  state: QaAgentState,
): 'updateTestcases' | typeof END => {
  const { messages, retryCount, maxRetries } = state

  // If we've exceeded max retries, terminate the workflow
  if (retryCount >= maxRetries) {
    return END
  }

  // Check the last tool message from runTestTool for validation errors
  const lastToolMessage = findLastToolMessage(messages)

  if (!lastToolMessage) {
    // No tool message found, something went wrong - terminate
    return END
  }

  // Check if there were test failures in the tool message content
  const content =
    typeof lastToolMessage.content === 'string'
      ? lastToolMessage.content
      : lastToolMessage.content
          .map((block) =>
            typeof block === 'string'
              ? block
              : block.type === 'text'
                ? block.text
                : '',
          )
          .join(' ')
  const hasValidationErrors = checkForValidationErrors(content)

  if (hasValidationErrors) {
    // There are validation errors and we have retries left - attempt healing
    return 'updateTestcases'
  }

  // All tests passed or no errors detected - workflow complete
  return END
}

/**
 * Find the last ToolMessage in the messages array (from runTestTool)
 */
const findLastToolMessage = (messages: BaseMessage[]): ToolMessage | null => {
  // Look for the most recent ToolMessage (should be from runTestTool)
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message instanceof ToolMessage) {
      return message
    }
  }
  return null
}

/**
 * Check if the tool message content indicates validation errors
 * This checks for failed test patterns in the runTestTool response
 */
const checkForValidationErrors = (content: string): boolean => {
  // Check for common failure indicators in the tool message
  const failureIndicators = [
    'failed',
    'error',
    '❌',
    'Test Case:', // formatValidationErrors includes this for failed tests
    'passed, 0 failed', // This would be success
  ]

  const hasFailureIndicators = failureIndicators.some((indicator) =>
    content.toLowerCase().includes(indicator.toLowerCase()),
  )

  // If content contains failure indicators but not success patterns, it's an error
  const successPattern = /(\d+)\/(\d+) test cases passed, 0 failed/
  const isAllTestsPassed =
    successPattern.test(content) ||
    (content.includes('All ') &&
      content.includes(' test cases passed successfully'))

  // Return true if there are failure indicators and it's not a success message
  return hasFailureIndicators && !isAllTestsPassed
}
