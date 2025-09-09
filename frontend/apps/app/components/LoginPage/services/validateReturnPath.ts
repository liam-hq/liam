/**
 * Validates that a return path is safe to redirect to.
 * Only allows same-origin, relative paths to prevent open redirect vulnerabilities.
 */
export function isValidReturnPath(path: string): boolean {
  // Empty path is invalid
  if (!path) return false

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