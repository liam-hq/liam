import type { WorkflowState } from '../types'

/**
 * Helper function to increment retry count and set error in state.
 * @param state - The current workflow state.
 * @param nodeName - The name of the node.
 * @param errorMessage - The error message to set.
 * @returns Updated workflow state with incremented retry count and error.
 */
export function incrementRetryCount(
  state: WorkflowState,
  nodeName: string,
  errorMessage: string,
): WorkflowState {
  const retryCount = state.retryCount[nodeName] ?? 0
  return {
    ...state,
    error: errorMessage,
    retryCount: {
      ...state.retryCount,
      [nodeName]: retryCount + 1,
    },
  }
}
