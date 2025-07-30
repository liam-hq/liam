import { err, ok, type Result, Result as ResultClass } from 'neverthrow'

/**
 * Log input processing with truncated preview
 */
export const logInputProcessing = (input: string, maxLength = 100): void => {
  console.info(`Processing input: ${input.substring(0, maxLength)}...`)
}

/**
 * Safe JSON parse with Result type
 */
export const safeJsonParse = <T = unknown>(
  jsonString: string,
  errorMessage = 'Failed to parse JSON',
): Result<T, Error> => {
  return ResultClass.fromThrowable(
    (): T => JSON.parse(jsonString),
    (error) => (error instanceof Error ? error : new Error(errorMessage)),
  )()
}

/**
 * Create error with prefixed message
 */
const createPrefixedError = (prefix: string, originalError: Error): Error => {
  return new Error(`${prefix}: ${originalError.message}`)
}

/**
 * Handle execution result with error prefixing
 */
export const handleExecutionResult = <T>(
  result: Result<T, Error>,
  errorPrefix: string,
): Result<T, Error> => {
  if (result.isErr()) {
    return err(createPrefixedError(errorPrefix, result.error))
  }
  return ok(result.value)
}
