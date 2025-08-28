import { Result, ResultAsync } from 'neverthrow'

const defaultErrorFn = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))

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

export function fromAsyncThrowable<A extends readonly unknown[], T>(
  fn: (...args: A) => Promise<T>,
): (...args: A) => ResultAsync<T, Error>
export function fromAsyncThrowable<
  A extends readonly unknown[],
  T,
  E extends Error,
>(
  fn: (...args: A) => Promise<T>,
  errorFn: (error: unknown) => E,
): (...args: A) => ResultAsync<T, E>
export function fromAsyncThrowable<
  A extends readonly unknown[],
  T,
  E extends Error,
>(fn: (...args: A) => Promise<T>, errorFn?: (error: unknown) => E) {
  return ResultAsync.fromThrowable(fn, errorFn ?? defaultErrorFn)
}
