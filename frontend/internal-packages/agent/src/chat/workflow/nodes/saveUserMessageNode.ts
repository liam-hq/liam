import type { WorkflowState } from '../types'

const NODE_NAME = 'saveUserMessageNode'

/**
 * Save User Message Node - Saves the user's message to the database
 * This is the first node in the workflow to ensure message persistence
 */
export async function saveUserMessageNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  // Save user message to database
  const saveResult = await state.repositories.schema.createTimelineItem({
    designSessionId: state.designSessionId,
    content: state.userInput,
    type: 'user',
    userId: state.userId,
  })

  if (!saveResult.success) {
    state.logger.error(`[${NODE_NAME}] Failed to save user message:`, {
      error: saveResult.error,
    })
    // Set error state to trigger transition to finalizeArtifacts
    return {
      ...state,
      error: `Failed to save message: ${saveResult.error}`,
    }
  }

  state.logger.log(`[${NODE_NAME}] Successfully saved user message`)

  return state
}
