import { errAsync, fromPromise, type ResultAsync } from '@liam-hq/neverthrow'

export const withTimeoutAndAbort = (
  fn: (signal: AbortSignal) => Promise<void>,
  ms: number,
  existingSignal: AbortSignal,
): ResultAsync<void, Error> => {
  if (existingSignal.aborted) {
    return errAsync(new Error('Request already aborted'))
  }

  return fromPromise(
    (async () => {
      const controller = new AbortController()
      existingSignal.addEventListener('abort', () => controller.abort())

      const timeoutId = setTimeout(() => controller.abort(), ms)

      try {
        return await fn(controller.signal)
      } finally {
        clearTimeout(timeoutId)
      }
    })(),
  )
}
