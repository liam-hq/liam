import type { Operation } from 'fast-json-patch'
import { err, ok, type Result } from 'neverthrow'

/**
 * Unescape JSON Pointer path according to RFC 6901
 */
function unescapeJsonPointer(path: string): string {
  return path.replace(/~1/g, '/').replace(/~0/g, '~')
}

/**
 * Check if value is a record object
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Check if a path part is dangerous for prototype pollution
 */
function isDangerousPathPart(part: string): boolean {
  return part === '__proto__' || part === 'constructor' || part === 'prototype'
}

/**
 * Check if a string represents a numeric array index
 */
function isNumericIndex(value: string): boolean {
  return /^\d+$/.test(value)
}

/**
 * Ensure array has sufficient length and object at index
 */
function ensureArrayElement(
  array: unknown[],
  index: number,
): Record<string, unknown> {
  while (array.length <= index) {
    array.push({})
  }
  if (!isRecord(array[index])) {
    array[index] = {}
  }
  const element = array[index]
  return isRecord(element) ? element : {}
}

/**
 * Handle array traversal logic
 */
function handleArrayTraversal(
  current: Record<string, unknown>,
  next: unknown[],
  nextPart: string | undefined,
): { newCurrent: Record<string, unknown>; skipNext: boolean } {
  if (!nextPart || !isNumericIndex(nextPart)) {
    return { newCurrent: current, skipNext: false }
  }

  const index = Number(nextPart)
  const arrayElement = ensureArrayElement(next, index)
  return { newCurrent: arrayElement, skipNext: true }
}

/**
 * Process a single path part
 */
function processPathPart(
  current: Record<string, unknown>,
  part: string,
  nextPart: string | undefined,
): Result<{ newCurrent: Record<string, unknown>; skipNext: boolean }, string> {
  if (isDangerousPathPart(part)) {
    return err(`Dangerous path part detected: ${part}`)
  }

  if (!(part in current)) {
    current[part] = nextPart && isNumericIndex(nextPart) ? [] : {}
  }

  const next = current[part]
  if (isRecord(next)) {
    return ok({ newCurrent: next, skipNext: false })
  }

  if (Array.isArray(next)) {
    const result = handleArrayTraversal(current, next, nextPart)
    return ok(result)
  }

  return ok({ newCurrent: current, skipNext: false })
}

/**
 * Create nested path if it doesn't exist
 */
function createNestedPath(
  target: Record<string, unknown>,
  pathParts: string[],
): Result<void, string> {
  let current: Record<string, unknown> = target

  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i]
    if (!part) continue

    const result = processPathPart(current, part, pathParts[i + 1])
    if (result.isErr()) {
      return err(result.error)
    }

    const { newCurrent, skipNext } = result.value
    current = newCurrent
    if (skipNext) {
      i++
    }
  }

  return ok(undefined)
}

/**
 * Ensure the necessary path structure exists before applying patch operations
 * This prevents "OPERATION_PATH_UNRESOLVABLE" errors
 */
export function ensurePathStructure(
  target: Record<string, unknown>,
  operations: Operation[],
): Result<void, string> {
  const modifyingOps = operations.filter(
    (op) => op.op === 'add' || op.op === 'replace',
  )

  for (const op of modifyingOps) {
    // RFC 6901: Split first, then unescape each part
    const pathParts = op.path.split('/').filter((part) => part !== '')
    const unescapedParts = pathParts.map((part) => unescapeJsonPointer(part))

    const result = createNestedPath(target, unescapedParts)
    if (result.isErr()) {
      return result
    }
  }

  return ok(undefined)
}
