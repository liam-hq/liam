import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

const NODE_NAME = 'finalizeArtifactsNode'

/**
 * Finalize Artifacts Node - Generate & Save Artifacts
 * Performed by dbAgentArtifactGen
 */
export async function finalizeArtifactsNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  if (state.onNodeProgress) {
    await state.onNodeProgress(
      'finalizeArtifacts',
      getWorkflowNodeProgress('finalizeArtifacts'),
    )
  }

  let finalResponse: string
  let errorToReturn: string | undefined

  // Handle different scenarios for final response
  if (state.error) {
    // If there's an error, create an error response for the user
    finalResponse = `Sorry, an error occurred during processing: ${state.error}`
    errorToReturn = state.error

    // Save error timeline item to database
    const saveResult = await state.repositories.schema.createTimelineItem({
      designSessionId: state.designSessionId,
      content: finalResponse,
      type: 'error',
    })

    if (!saveResult.success) {
      console.error('Failed to save error message:', saveResult.error)
      // Continue processing even if message saving fails
    }
  } else if (state.generatedAnswer) {
    // Normal case: use the generated answer
    finalResponse = state.generatedAnswer
    errorToReturn = undefined

    // Save AI timeline item to database
    const saveResult = await state.repositories.schema.createTimelineItem({
      designSessionId: state.designSessionId,
      content: finalResponse,
      type: 'assistant',
    })

    if (!saveResult.success) {
      console.error('Failed to save AI timeline item:', saveResult.error)
      // Continue processing even if timeline item saving fails
    }
  } else {
    // Fallback case: no generated answer and no specific error
    finalResponse = 'Sorry, we could not generate an answer. Please try again.'
    errorToReturn = 'No generated answer available'

    // Save fallback timeline item to database
    const saveResult = await state.repositories.schema.createTimelineItem({
      designSessionId: state.designSessionId,
      content: finalResponse,
      type: 'error',
    })

    if (!saveResult.success) {
      console.error('Failed to save fallback message:', saveResult.error)
      // Continue processing even if message saving fails
    }
  }

  state.logger.log(`[${NODE_NAME}] Completed`)

  return {
    ...state,
    finalResponse,
    error: errorToReturn,
  }
}
