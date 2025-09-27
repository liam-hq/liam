'use client'

import {
  type BaseMessage,
  coerceMessageLikeToMessage,
} from '@langchain/core/messages'
import { MessageTupleManager, SSE_EVENTS } from '@liam-hq/agent/client'
import { err, ok, type Result } from 'neverthrow'
import { useCallback, useMemo, useRef, useState } from 'react'
import { object, safeParse, string } from 'valibot'
import { useNavigationGuard } from '../../../../hooks/useNavigationGuard'
import { ERROR_MESSAGES } from '../../components/Chat/constants/chatConstants'
import { parseSse } from './parseSse'
import { useSessionStorageOnce } from './useSessionStorageOnce'

type StartParams = {
  userInput: string
  designSessionId: string
  isDeepModelingEnabled: boolean
}

const MAX_RETRIES = 2

type ReplayParams = Pick<
  StartParams,
  'designSessionId' | 'isDeepModelingEnabled'
>

type StreamError =
  | { type: 'network'; message: string; status: number }
  | { type: 'abort'; message: string }
  | { type: 'timeout'; message: string }
  | { type: 'unknown'; message: string }

type StreamAttemptStatus = 'complete' | 'shouldRetry'

const extractStreamErrorMessage = (rawData: unknown): string => {
  const parsedData = (() => {
    if (typeof rawData !== 'string') return rawData
    try {
      return JSON.parse(rawData)
    } catch {
      return null
    }
  })()

  const schema = object({ message: string() })
  const result = safeParse(schema, parsedData)
  if (result.success) return result.output.message

  return ERROR_MESSAGES.STREAM_UNKNOWN
}

/**
 * NOTE: Custom hook based on useStream from @langchain/langgraph-sdk
 * @see https://github.com/langchain-ai/langgraphjs/blob/3320793bffffa02682227644aefbee95dee330a2/libs/sdk/src/react/stream.tsx
 */
type Props = {
  designSessionId: string
  initialMessages: BaseMessage[]
}
export const useStream = ({ designSessionId, initialMessages }: Props) => {
  const messageManagerRef = useRef(new MessageTupleManager())
  const storedMessage = useSessionStorageOnce(designSessionId)
  const processedInitialMessages = useMemo(() => {
    if (storedMessage) {
      return [storedMessage, ...initialMessages]
    }
    return initialMessages
  }, [storedMessage, initialMessages])
  const [messages, setMessages] = useState<BaseMessage[]>(
    processedInitialMessages,
  )

  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)

  const finalizeStream = useCallback(() => {
    setIsStreaming(false)
    abortRef.current = null
    retryCountRef.current = 0
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useNavigationGuard((_event) => {
    if (isStreaming) {
      const shouldContinue = window.confirm(
        "Design session is currently running. If you leave now, you'll lose your session progress. Continue anyway?",
      )
      if (shouldContinue) {
        abortRef.current?.abort()
        return true
      }
      return false
    }
    return true
  })

  const handleMessageEvent = useCallback((ev: { data: string }) => {
    const parsedData = JSON.parse(ev.data)
    const [serialized, metadata] = parsedData
    const messageId = messageManagerRef.current.add(serialized, metadata)
    if (!messageId) return

    setMessages((prev) => {
      const newMessages = [...prev]
      const result = messageManagerRef.current.get(messageId, prev.length)
      if (!result?.chunk) return newMessages

      const { chunk, index } = result
      const message = coerceMessageLikeToMessage(chunk)

      if (index === undefined) {
        newMessages.push(message)
      } else {
        newMessages[index] = message
      }

      return newMessages
    })
  }, [])

  const processStreamEvents = useCallback(
    async (res: Response): Promise<boolean> => {
      if (!res.body) return false

      let endEventReceived = false

      for await (const ev of parseSse(res.body)) {
        if (ev.event === SSE_EVENTS.END) {
          endEventReceived = true
          setIsStreaming(false)
          break
        }

        if (ev.event === SSE_EVENTS.ERROR) {
          setIsStreaming(false)
          setError(extractStreamErrorMessage(ev.data))
          continue
        }

        if (ev.event === SSE_EVENTS.MESSAGES) {
          handleMessageEvent(ev)
        }
      }

      return endEventReceived
    },
    [handleMessageEvent],
  )

  const runStreamAttempt = useCallback(
    async (
      endpoint: string,
      payload: unknown,
    ): Promise<Result<StreamAttemptStatus, StreamError>> => {
      abortRef.current?.abort()

      const controller = new AbortController()
      abortRef.current = controller
      setIsStreaming(true)
      setError(null)

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        if (!res.body) {
          finalizeStream()
          return err({
            type: 'network',
            message: ERROR_MESSAGES.FETCH_FAILED,
            status: res.status,
          })
        }

        const endEventReceived = await processStreamEvents(res)

        if (!endEventReceived) {
          if (controller.signal.aborted) {
            finalizeStream()
            return err({
              type: 'abort',
              message: 'Request was aborted',
            })
          }

          controller.abort()
          abortRef.current = null
          return ok('shouldRetry')
        }

        finalizeStream()
        return ok('complete')
      } catch (unknownError) {
        finalizeStream()

        if (
          unknownError instanceof Error &&
          unknownError.name === 'AbortError'
        ) {
          return err({
            type: 'abort',
            message: 'Request was aborted',
          })
        }

        return err({
          type: 'unknown',
          message: ERROR_MESSAGES.GENERAL,
        })
      }
    },
    [finalizeStream, processStreamEvents],
  )

  const replay = useCallback(
    async (params: ReplayParams): Promise<Result<void, StreamError>> => {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
        retryCountRef.current = attempt

        const result = await runStreamAttempt('/api/chat/replay', params)

        if (result.isErr()) {
          return err(result.error)
        }

        if (result.value === 'complete') {
          return ok(undefined)
        }
      }

      const timeoutMessage = ERROR_MESSAGES.CONNECTION_TIMEOUT
      finalizeStream()
      setError(timeoutMessage)
      return err({
        type: 'timeout',
        message: timeoutMessage,
      })
    },
    [finalizeStream, runStreamAttempt],
  )

  const start = useCallback(
    async (params: StartParams): Promise<Result<void, StreamError>> => {
      abortRef.current?.abort()
      retryCountRef.current = 0

      const result = await runStreamAttempt('/api/chat/stream', params)

      if (result.isErr()) {
        return err(result.error)
      }

      if (result.value === 'complete') {
        return ok(undefined)
      }

      return replay({
        designSessionId: params.designSessionId,
        isDeepModelingEnabled: params.isDeepModelingEnabled,
      })
    },
    [replay, runStreamAttempt],
  )

  return {
    messages,
    isStreaming,
    error,
    stop,
    start,
    clearError,
  }
}
