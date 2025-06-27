import pkg, { type Operation } from 'fast-json-patch'

const { applyPatch } = pkg // see https://github.com/Starcounter-Jack/JSON-Patch/issues/310

export function applyPatchOperations<T extends Record<string, unknown>>(
  target: T,
  operations: Operation[],
): void {
  applyPatch(target, operations, true, true)
}
