import type { Operation } from 'fast-json-patch'
import { applyPatch } from 'fast-json-patch'

export function applyPatchOperations<T extends Record<string, unknown>>(
  target: T,
  operations: Operation[],
): void {
  for (const operation of operations) {
    if (needsCustomHandling(operation)) {
      applyOperationCustom(target, operation)
    } else {
      try {
        applyPatch(target, [operation], false, true, true)
      } catch (error) {
        if (
          (operation.op === 'add' || operation.op === 'replace') &&
          error instanceof Error &&
          (error.message.includes('Cannot read properties of undefined') ||
            error.message.includes('Cannot set properties of undefined'))
        ) {
          createNestedPathAndApply(target, operation)
        } else if (operation.op === 'remove') {
        } else {
          throw error
        }
      }
    }
  }
}

function needsCustomHandling(operation: Operation): boolean {
  return operation.path.includes('~')
}

function applyOperationCustom<T extends Record<string, unknown>>(
  target: T,
  operation: Operation,
): void {
  if (operation.op === 'add' || operation.op === 'replace') {
    createNestedPathAndApply(target, operation)
  } else if (operation.op === 'remove') {
    removeAtPath(target, operation)
  } else {
    throw new Error(`Operation type '${operation.op}' is not implemented`)
  }
}

function removeAtPath<T extends Record<string, unknown>>(
  target: T,
  operation: Operation,
): void {
  const path = operation.path.split('/').filter(Boolean)
  if (path.length === 0) return

  const lastKey = path.pop()
  if (lastKey === undefined) return

  let current: Record<string, unknown> = target
  for (const key of path) {
    const next = current[key]
    if (typeof next !== 'object' || next === null || Array.isArray(next)) return
    current = next as Record<string, unknown>
  }

  delete current[lastKey]
}

function createNestedPathAndApply<T extends Record<string, unknown>>(
  target: T,
  operation: Operation,
): void {
  const path = operation.path.split('/').filter(Boolean)
  if (path.length === 0) return

  const lastKey = path.pop()
  if (lastKey === undefined) return

  let current: Record<string, unknown> = target
  for (const key of path) {
    if (
      !(key in current) ||
      typeof current[key] !== 'object' ||
      current[key] === null ||
      Array.isArray(current[key])
    ) {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }

  if (operation.op === 'add' || operation.op === 'replace') {
    current[lastKey] = operation.value
  }
}
