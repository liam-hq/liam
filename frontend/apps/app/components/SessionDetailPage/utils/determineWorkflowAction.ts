import type { BaseMessage } from '@langchain/core/messages'
import { isHumanMessage } from '@langchain/core/messages'

type WorkflowAction =
  | { type: 'start'; userInput: string }
  | { type: 'replay' }
  | { type: 'none' }

/**
 * Pure function to determine workflow action
 *
 * @param messages - Message history
 * @param isWorkflowInProgress - Whether workflow is in progress (from sessionStorage)
 * @param hasTriggered - Whether workflow has already been triggered
 * @returns Action to execute
 */
export const determineWorkflowAction = (
  messages: BaseMessage[],
  isWorkflowInProgress: boolean,
  hasTriggered: boolean,
): WorkflowAction => {
  // 1. Already triggered - do nothing
  if (hasTriggered) {
    return { type: 'none' }
  }

  // 2. Workflow in progress flag exists - resume interrupted workflow
  if (isWorkflowInProgress) {
    return { type: 'replay' }
  }

  // 3. Single unanswered user message - start new workflow
  if (messages.length === 1) {
    const firstMessage = messages[0]
    if (firstMessage && isHumanMessage(firstMessage)) {
      return {
        type: 'start',
        userInput: String(firstMessage.content),
      }
    }
  }

  // 4. Otherwise - do nothing
  return { type: 'none' }
}
