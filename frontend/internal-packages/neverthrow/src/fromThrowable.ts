import { Result } from 'neverthrow'
import { defaultErrorFn } from './defaultErrorFn.js'

export function fromThrowable<A extends readonly unknown[], T>(
  fn: (...args: A) => T,
): (...args: A) => Result<T, Error>
export function fromThrowable<A extends readonly unknown[], T, E>(
  fn: (...args: A) => T,
  errorFn: (error: unknown) => E,
): (...args: A) => Result<T, E>
export function fromThrowable<A extends readonly unknown[], T, E>(
  fn: (...args: A) => T,
  errorFn?: (error: unknown) => E,
) {
  return Result.fromThrowable(
    fn,
    errorFn ?? (defaultErrorFn as (error: unknown) => E),
  )
}
