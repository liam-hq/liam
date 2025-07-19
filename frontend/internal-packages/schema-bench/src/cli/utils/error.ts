import { formatError } from '../../shared/formatError.ts'
import type { WorkspaceError } from '../../workspace/types'

/**
 * Format error for CLI display
 */
const isWorkspaceError = (error: unknown): error is WorkspaceError => {
  return error !== null && typeof error === 'object' && 'type' in error
}

const formatCliError = (error: unknown): string => {
  if (isWorkspaceError(error)) {
    // It's a WorkspaceError, use the specialized formatter
    return formatError(error)
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

/**
 * Handle CLI errors with consistent formatting and exit
 */
export const handleCliError = (
  message: string,
  error?: Error | unknown,
): never => {
  if (error) {
    console.error(`❌ ${message}:`, formatCliError(error))
  } else {
    console.error(`❌ ${message}`)
  }
  process.exit(1)
}

/**
 * Handle unexpected errors in CLI
 */
export const handleUnexpectedError = (error: unknown): never => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
}
