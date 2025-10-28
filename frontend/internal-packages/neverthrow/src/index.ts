import { Result } from 'neverthrow'

import { defaultErrorFn } from './defaultErrorFn'

export function fromThrowable<A extends readonly unknown[], T>(
  fn: (...args: A) => T,
): (...args: A) => Result<T, Error>
export function fromThrowable<A extends readonly unknown[], T, E extends Error>(
  fn: (...args: A) => T,
  errorFn: (error: unknown) => E,
): (...args: A) => Result<T, E>
export function fromThrowable<A extends readonly unknown[], T, E extends Error>(
  fn: (...args: A) => T,
  errorFn?: (error: unknown) => E,
) {
  return Result.fromThrowable(fn, errorFn ?? defaultErrorFn)
}

export type { Result, ResultAsync } from 'neverthrow'
export { fromAsyncThrowable } from './fromAsyncThrowable'
export { fromPromise } from './fromPromise'
export { fromValibotSafeParse } from './fromValibotSafeParse'
export { toAsync } from './toAsync'
