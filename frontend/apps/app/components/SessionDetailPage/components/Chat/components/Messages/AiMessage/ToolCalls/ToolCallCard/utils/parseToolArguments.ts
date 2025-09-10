/**
 * Check if a value is a plain object (not Date, Map, Set, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  // Check if it's an array
  if (Array.isArray(value)) {
    return false
  }

  // Check if it's a plain object by verifying its prototype
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Parse tool arguments from various formats
 */
export function parseToolArguments(args: unknown): Record<string, unknown> {
  // If already a plain object, return a clone
  if (isPlainObject(args)) {
    return { ...args }
  }

  // If string, try to parse as JSON
  if (typeof args === 'string') {
    try {
      const parsed = JSON.parse(args)
      if (isPlainObject(parsed)) {
        return parsed
      }
    } catch {
      // If parsing fails, return as single argument
      return { value: args }
    }
  }

  // For other types, wrap in object
  return { value: args }
}
