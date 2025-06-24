import { incrementRetryCount } from '../shared/retryUtils'
import type { WorkflowState } from '../types'

const NODE_NAME = 'reviewDeliverables'

/**
 * Review Deliverables Node - Final Requirements & Deliverables Confirmation
 * Performed by pmReviewAgent
 */
export async function reviewDeliverablesNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  try {
    // TODO: Implement deliverables review logic
    // This node should perform final confirmation of requirements and deliverables
    // For now, this is a stub that just passes through the state

    state.logger.log(`[${NODE_NAME}] Completed`)

    return {
      ...state,
      error: undefined, // Clear error on success
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    state.logger.error(`[${NODE_NAME}] Failed: ${errorMessage}`)

    // Increment retry count and set error
    return incrementRetryCount(state, NODE_NAME, errorMessage)
  }
}
