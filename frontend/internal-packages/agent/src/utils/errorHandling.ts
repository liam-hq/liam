/**
 * Custom error class for workflow termination
 * This error should not be retried by the workflow engine
 */
export class WorkflowTerminationError extends Error {
  public readonly nodeId: string
  public readonly originalError: Error

  constructor(originalError: Error, nodeId: string) {
    super(`Error in ${nodeId}: ${originalError.message}`)
    this.name = 'WorkflowTerminationError'
    this.nodeId = nodeId
    this.originalError = originalError
  }
}

/**
 * Retry policy configuration for all nodes
 * WorkflowTerminationError should not be retried as it indicates
 * intentional workflow termination due to unrecoverable errors
 */
export const RETRY_POLICY = {
  maxAttempts: process.env['NODE_ENV'] === 'test' ? 1 : 3,
  retryOn: (error: unknown) => {
    // Don't retry WorkflowTerminationError - these are intentional terminations
    if (error instanceof WorkflowTerminationError) {
      return false
    }
    // Retry all other errors
    return true
  },
}
