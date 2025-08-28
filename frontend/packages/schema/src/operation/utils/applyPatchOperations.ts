import { fromThrowable } from '@liam-hq/neverthrow'
import pkg, { type Operation } from 'fast-json-patch'
import type { Result } from 'neverthrow'

const { applyPatch } = pkg // see https://github.com/Starcounter-Jack/JSON-Patch/issues/310

export function applyPatchOperations<T extends Record<string, unknown>>(
  target: T,
  operations: Operation[],
): Result<T, Error> {
  return fromThrowable(() => {
    const result = applyPatch(target, operations, true, false)
    return result.newDocument
  })()
}
