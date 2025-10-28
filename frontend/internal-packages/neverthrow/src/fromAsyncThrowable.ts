import { ResultAsync } from 'neverthrow'
import { defaultErrorFn } from './defaultErrorFn.js'

export function fromAsyncThrowable<A extends readonly unknown[], T>(
  fn: (...args: A) => Promise<T>,
): (...args: A) => ResultAsync<T, Error>
export function fromAsyncThrowable<A extends readonly unknown[], T, E>(
  fn: (...args: A) => Promise<T>,
  errorFn: (error: unknown) => E,
): (...args: A) => ResultAsync<T, E>
export function fromAsyncThrowable<A extends readonly unknown[], T, E>(
  fn: (...args: A) => Promise<T>,
  errorFn?: (error: unknown) => E,
) {
  return ResultAsync.fromThrowable(
    fn,
    errorFn ?? (defaultErrorFn as (error: unknown) => E),
  )
}
