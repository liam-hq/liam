import { ResultAsync } from 'neverthrow'
import { defaultErrorFn } from './defaultErrorFn'

export function fromPromise<T>(promise: Promise<T>): ResultAsync<T, Error>
export function fromPromise<T, E extends Error>(
  promise: Promise<T>,
  errorFn: (error: unknown) => E,
): ResultAsync<T, E>
export function fromPromise<T, E extends Error>(
  promise: Promise<T>,
  errorFn?: (error: unknown) => E,
) {
  return ResultAsync.fromPromise(promise, errorFn ?? defaultErrorFn)
}
