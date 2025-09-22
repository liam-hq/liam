export const defaultErrorFn = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))
