import { SSE_EVENTS } from '@liam-hq/agent/client'
import * as Sentry from '@sentry/nextjs'

// Constants
export const maxDuration = 800
const TIMEOUT_MS = 750000 // 750 seconds

// SSE event formatting function
export const line = (event: string, data: unknown) => {
  const payload = typeof data === 'string' ? data : JSON.stringify(data)
  return `event:${event}\ndata:${payload}\n\n`
}

const timeout = (timeoutMs: number) => {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
  })
}

export const streamWithTimeout = (
  fn: (
    controller: ReadableStreamDefaultController<Uint8Array>,
    signal: AbortSignal,
  ) => Promise<void>,
  options: {
    designSessionId: string
    signal: AbortSignal
  },
) => {
  const enc = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const internalAbortController = new AbortController()

      const combinedSignal = AbortSignal.any([
        options.signal,
        internalAbortController.signal,
      ])

      try {
        await Promise.race([
          fn(controller, combinedSignal),
          timeout(TIMEOUT_MS).then(() => {
            internalAbortController.abort()
            // eslint-disable-next-line no-throw-error/no-throw-error
            throw new Error('Request timeout')
          }),
        ])
      } catch (err) {
        internalAbortController.abort()

        Sentry.captureException(err, {
          tags: {
            designSchemaId: options.designSessionId,
          },
        })

        const message = err instanceof Error ? err.message : String(err)
        controller.enqueue(enc.encode(line(SSE_EVENTS.ERROR, { message })))
      } finally {
        controller.close()
      }
    },
  })
}
