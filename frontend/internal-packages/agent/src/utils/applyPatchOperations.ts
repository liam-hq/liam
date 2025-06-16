import type { Operation } from 'fast-json-patch'
import { match } from 'ts-pattern'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getOrCreateObject(
  obj: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const value = obj[key]
  if (isRecord(value)) return value

  const newObj: Record<string, unknown> = {}
  obj[key] = newObj
  return newObj
}

/**
 * Applies JSON patch operations to a target object
 */
export function applyPatchOperations<T extends Record<string, unknown>>(
  target: T,
  operations: Operation[],
): void {
  for (const operation of operations) {
    match<Operation>(operation)
      .with({ op: 'add' }, { op: 'replace' }, (op) => {
        const path = op.path.split('/').filter(Boolean)
        if (path.length === 0) return

        const lastKey = path.pop()
        if (lastKey === undefined) return

        let current: Record<string, unknown> = target
        for (const key of path) {
          current = getOrCreateObject(current, key)
        }

        current[lastKey] = op.value
      })
      .with({ op: 'remove' }, (op) => {
        const path = op.path.split('/').filter(Boolean)
        if (path.length === 0) return

        const lastKey = path.pop()
        if (lastKey === undefined) return

        let current: Record<string, unknown> = target
        for (const key of path) {
          const next = current[key]
          if (!isRecord(next)) return
          current = next
        }

        delete current[lastKey]
      })
      .otherwise((op) => {
        throw new Error(`Operation type '${op.op}' is not implemented`)
      })
  }
}
