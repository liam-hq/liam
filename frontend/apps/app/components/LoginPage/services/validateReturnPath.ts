import * as v from 'valibot'

/**
 * Valibot schema for validating relative return paths.
 * Only allows relative paths starting with "/" to prevent open redirect vulnerabilities.
 */
export const RelativeReturnPathSchema = v.pipe(
  v.string(),
  v.custom<string>((value) => {
    const str = String(value)
    // Must start with "/" (relative path) but not "//" (protocol-relative URL)
    return str.startsWith('/') && !str.startsWith('//')
  }, 'Path must be a relative path starting with /'),
)

/**
 * Sanitizes a return path, returning a safe default if invalid.
 * This is used for Next.js redirect() and NextResponse.redirect() to ensure
 * only same-origin, relative paths are used for navigation.
 */
export function sanitizeReturnPath(
  path: string | null | undefined,
  defaultPath = '/design_sessions/new',
): string {
  if (!path) return defaultPath

  const result = v.safeParse(RelativeReturnPathSchema, path)
  return result.success ? result.output : defaultPath
}
