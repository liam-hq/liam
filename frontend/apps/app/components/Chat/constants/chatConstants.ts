/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  GENERAL: 'Sorry, an error occurred. Please try again.',
  FETCH_FAILED: 'Failed to get response',
  RESPONSE_NOT_READABLE: 'Response body is not readable',
} as const

/**
 * Progress message emoji patterns
 */
export const PROGRESS_EMOJI_PATTERN = /\s+(🔄|✅|❌)$/
