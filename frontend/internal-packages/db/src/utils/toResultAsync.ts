import { errAsync, okAsync, ResultAsync } from '@liam-hq/neverthrow'

/**
 * Options for toResultAsync function
 */
type ToResultAsyncOptions = {
  allowNull?: boolean
}

/**
 * Convert Supabase query result to ResultAsync for error handling with neverthrow
 *
 * @param queryBuilder - The Supabase query builder
 * @param options - Options for handling the result
 * @returns ResultAsync with the data or error
 *
 * @example
 * ```ts
 * // For select result - null data is an error
 * return toResultAsync(
 *   client.from('table').select().single()
 * )
 *
 * // For upsert/delete operation - null data is allowed
 * return toResultAsync(
 *   client.from('table').upsert(data),
 *   { allowNull: true }
 * )
 * ```
 */
export function toResultAsync<T>(
  queryBuilder: PromiseLike<{ data: T | null; error: unknown }>,
): ResultAsync<T, Error>

export function toResultAsync<T>(
  queryBuilder: PromiseLike<{ data: T | null; error: unknown }>,
  options: { allowNull: true },
): ResultAsync<T | null, Error>

export function toResultAsync<T>(
  queryBuilder: PromiseLike<{ data: T | null; error: unknown }>,
  options: { allowNull: false },
): ResultAsync<T, Error>

export function toResultAsync<T>(
  queryBuilder: PromiseLike<{ data: T | null; error: unknown }>,
  options?: ToResultAsyncOptions,
): ResultAsync<T | null, Error> | ResultAsync<T, Error> {
  const allowNull = options?.allowNull ?? false

  return ResultAsync.fromPromise(
    queryBuilder,
    (error) =>
      new Error(error instanceof Error ? error.message : String(error)),
  ).andThen(({ data, error }) => {
    if (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? String(error.message)
            : String(error)
      return errAsync(new Error(errorMessage))
    }

    if (data === null && !allowNull) {
      return errAsync(new Error('No data returned'))
    }

    return okAsync(data)
  })
}
