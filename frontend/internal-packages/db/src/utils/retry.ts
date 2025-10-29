import { ResultAsync } from '@liam-hq/neverthrow'

/**
 * Retry configuration for Supabase operations
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
} as const

/**
 * Determines if an error is retryable based on common network/fetch failures
 */
function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const errorMessage =
    'message' in error ? String(error.message).toLowerCase() : ''
  const errorName = 'name' in error ? String(error.name).toLowerCase() : ''

  const retryablePatterns = [
    'fetch failed',
    'network error',
    'timeout',
    'connection',
    'socket hang up',
    'enotfound',
    'econnreset',
    'etimedout',
    'internal server error',
    '500',
    '502',
    '503',
    '504',
    'bad gateway',
    'gateway error',
    'service unavailable',
    'gateway timeout',
  ]

  return retryablePatterns.some(
    (pattern) => errorMessage.includes(pattern) || errorName.includes(pattern),
  )
}

/**
 * Options for retry configuration
 */
type RetryOptions = {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

/**
 * Retry a function with exponential backoff using Result types
 */
export function retry<T, E>(
  fn: () => ResultAsync<T, E>,
  options?: RetryOptions,
): ResultAsync<T, E> {
  const maxAttempts = options?.maxAttempts ?? RETRY_CONFIG.maxAttempts
  const baseDelayMs = options?.baseDelayMs ?? RETRY_CONFIG.baseDelayMs
  const maxDelayMs = options?.maxDelayMs ?? RETRY_CONFIG.maxDelayMs
  const backoffMultiplier =
    options?.backoffMultiplier ?? RETRY_CONFIG.backoffMultiplier

  const attemptRetry = async (attemptNumber: number): Promise<T> => {
    const result = await fn()

    if (result.isOk()) {
      return result.value
    }

    if (attemptNumber >= maxAttempts || !isRetryableError(result.error)) {
      throw result.error
    }

    const delay = Math.min(
      baseDelayMs * backoffMultiplier ** (attemptNumber - 1),
      maxDelayMs,
    )

    await new Promise((resolve) => setTimeout(resolve, delay))
    return attemptRetry(attemptNumber + 1)
  }

  return ResultAsync.fromPromise(
    attemptRetry(1),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (error) => error as E,
  )
}
