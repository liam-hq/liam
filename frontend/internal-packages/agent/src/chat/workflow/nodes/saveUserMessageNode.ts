import type { RunnableConfig } from '@langchain/core/runnables'
import { getConfigurable } from '../shared/getConfigurable.ts'
import type { WorkflowState } from '../types.ts'

/**
 * Save User Message Node - Saves the user's message to the database
 * This is the first node in the workflow to ensure message persistence
 */
export async function saveUserMessageNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { repositories } = configurableResult.value

  // Save user message to database
  const saveResult = await repositories.schema.createTimelineItem({
    designSessionId: state.designSessionId,
    content: state.userInput,
    type: 'user',
    userId: state.userId,
  })

  if (!saveResult.success) {
    // Set error state to trigger transition to finalizeArtifacts
    const error = new Error(`Failed to save message: ${saveResult.error}`)
    return {
      ...state,
      error,
    }
  }

  return state
}
