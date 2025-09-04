export class WorkflowTerminationError extends Error {
  constructor(message: string, cause?: Error) {
    super(message)
    this.name = 'WorkflowTerminationError'
    if (cause?.stack) {
      this.stack = cause.stack
    }
  }
}

export const RETRY_POLICY = {
  maxAttempts: process.env['NODE_ENV'] === 'test' ? 1 : 3,
}
