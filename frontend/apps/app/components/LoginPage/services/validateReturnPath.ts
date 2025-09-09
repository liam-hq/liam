/**
 * Validates that a return path is safe to redirect to.
 * Only allows same-origin, relative paths to prevent open redirect vulnerabilities.
 */
export function isValidReturnPath(path: string): boolean {
  // Empty path is invalid
  if (!path) return false

  // Type check for non-string values
  if (typeof path !== 'string') return false

  // Must start with / (relative path)
  if (!path.startsWith('/')) return false

  // Reject absolute URLs (containing protocol)
  if (path.includes('://')) return false

  // Reject protocol-relative URLs (//example.com)
  if (path.startsWith('//')) return false

  // Reject data: and javascript: URLs
  if (path.match(/^(data|javascript):/i)) return false

  // Additional safety: reject paths with @ which could be used in URLs
  if (path.includes('@')) return false

  // Reject paths containing control characters (including CR/LF)
  // This prevents header injection and other control character attacks
  // Matches any character with ASCII code < 32 (space) or = 127 (DEL)
  // Also checks for URL encoded CR (%0d/%0D) and LF (%0a/%0A)
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally detecting control characters for security
  if (/[\x00-\x1f\x7f]/.test(path)) return false
  if (/%0[ad]/i.test(path)) return false

  return true
}

/**
 * Sanitizes a return path, returning a safe default if invalid.
 */
export function sanitizeReturnPath(
  path: string | null | undefined,
  defaultPath = '/design_sessions/new',
): string {
  if (!path) return defaultPath
  return isValidReturnPath(path) ? path : defaultPath
}
