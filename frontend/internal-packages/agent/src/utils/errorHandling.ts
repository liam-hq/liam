export class WorkflowTerminationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WorkflowTerminationError'
  }
}

export const RETRY_POLICY = {
  maxAttempts: process.env['NODE_ENV'] === 'test' ? 1 : 3,
}
