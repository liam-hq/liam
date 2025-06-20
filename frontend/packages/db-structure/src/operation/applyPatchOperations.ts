import { applyPatch, type Operation } from 'fast-json-patch'

export function applyPatchOperations<T extends Record<string, unknown>>(
  target: T,
  operations: Operation[],
): void {
  applyPatch(target, operations, true, true)
}
