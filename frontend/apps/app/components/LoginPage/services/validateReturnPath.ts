import * as v from 'valibot'

/**
 * Custom validator that checks if a path starts with '/'
 */
const startsWithSlash = v.custom<string>((value) => {
  const str = String(value)
  return str.startsWith('/')
}, 'Path must start with /')

/**
 * Custom validator that rejects paths containing control characters
 */
const noControlCharacters = v.custom<string>((value) => {
  const str = String(value)
  // Reject any control characters (ASCII < 32 or = 127)
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally detecting control characters for security
  if (/[\x00-\x1f\x7f]/.test(str)) return false
  // Reject URL encoded CR (%0d/%0D) and LF (%0a/%0A)
  if (/%0[ad]/i.test(str)) return false
  return true
}, 'Path must not contain control characters')

/**
 * Custom validator that rejects absolute URLs with protocol
 */
const noProtocol = v.custom<string>((value) => {
  const str = String(value)
  // Only check the path segment before query parameters or hash
  const queryIndex = str.indexOf('?')
  const hashIndex = str.indexOf('#')
  const firstDelimiter = Math.min(
    queryIndex === -1 ? str.length : queryIndex,
    hashIndex === -1 ? str.length : hashIndex,
  )
  const pathSegment = str.slice(0, firstDelimiter)
  return !pathSegment.includes('://')
}, 'Path must not contain protocol')

/**
 * Custom validator that rejects protocol-relative URLs
 */
const notProtocolRelative = v.custom<string>((value) => {
  const str = String(value)
  return !str.startsWith('//')
}, 'Path must not be protocol-relative')

/**
 * Custom validator that rejects javascript: and data: URLs
 */
const noJavascriptOrDataUrl = v.custom<string>((value) => {
  const str = String(value)
  return !str.match(/^(data|javascript):/i)
}, 'Path must not be a javascript: or data: URL')

/**
 * Custom validator that rejects paths containing @ (userinfo-like patterns)
 */
const noUserInfo = v.custom<string>((value) => {
  const str = String(value)
  return !str.includes('@')
}, 'Path must not contain @ character')

/**
 * Valibot schema for validating relative return paths.
 * Only allows safe, same-origin relative paths to prevent open redirect vulnerabilities.
 */
export const RelativeReturnPathSchema = v.pipe(
  v.string(),
  startsWithSlash,
  noControlCharacters,
  noProtocol,
  notProtocolRelative,
  noJavascriptOrDataUrl,
  noUserInfo,
)

/**
 * Type for a validated relative return path
 */
type RelativeReturnPath = v.InferOutput<typeof RelativeReturnPathSchema>

/**
 * Validates that a return path is safe to redirect to.
 * Only allows same-origin, relative paths to prevent open redirect vulnerabilities.
 */
export function isValidReturnPath(path: string): boolean {
  // Empty path is invalid
  if (!path) return false

  // Type check for non-string values
  if (typeof path !== 'string') return false

  const result = v.safeParse(RelativeReturnPathSchema, path)
  return result.success
}

/**
 * Parses a return path using the schema, throwing on invalid input.
 * Use this when you need the parsed value and want to handle errors explicitly.
 */
export function parseReturnPath(path: string): RelativeReturnPath {
  return v.parse(RelativeReturnPathSchema, path)
}

/**
 * Sanitizes a return path, returning a safe default if invalid.
 */
export function sanitizeReturnPath(
  path: string | null | undefined,
  defaultPath = '/design_sessions/new',
): string {
  if (!path) return defaultPath

  const result = v.safeParse(RelativeReturnPathSchema, path)
  return result.success ? result.output : defaultPath
}
