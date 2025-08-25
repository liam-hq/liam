import { errAsync, okAsync, ResultAsync } from 'neverthrow'

/**
 * Convert Supabase query result to ResultAsync for error handling with neverthrow
 *
 * @param queryBuilder - The Supabase query builder
 * @returns ResultAsync with the data or error
 *
 * @example
 * ```ts
 * // For single result
 * return toResultAsync(
 *   client.from('table').select().single()
 * )
 *
 * // For array result
 * return toResultAsync(
 *   client.from('table').select()
 * )
 * ```
 */
export const toResultAsync = <T>(
  queryBuilder: PromiseLike<{ data: T | null; error: unknown }>,
): ResultAsync<T, Error> => {
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

    if (data === null) {
      return errAsync(new Error('No data returned'))
    }

    return okAsync(data)
  })
}
