import { errAsync, okAsync, type Result, type ResultAsync } from 'neverthrow'

export const toAsync = <T, E>(result: Result<T, E>): ResultAsync<T, E> => {
  return result.isOk() ? okAsync(result.value) : errAsync(result.error)
}
