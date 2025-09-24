'use client'

import {
  type BaseMessage,
  coerceMessageLikeToMessage,
} from '@langchain/core/messages'
import { MessageTupleManager, SSE_EVENTS } from '@liam-hq/agent/client'
import { err, ok, type Result } from 'neverthrow'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigationGuard } from '../../../../hooks/useNavigationGuard'
import { ERROR_MESSAGES } from '../../components/Chat/constants/chatConstants'
import { parseSse } from './parseSse'
import { useSessionStorageOnce } from './useSessionStorageOnce'

const MAX_RETRIES = 2

type StreamError = {
  type: 'network' | 'abort' | 'unknown'
  message: string
  status?: number
}

type ChatRequest = {
  userInput: string
  designSessionId: string
  isDeepModelingEnabled: boolean
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

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useNavigationGuard(() => {
    abortRef.current?.abort()
  })

  const processSSEStream = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor to reduce complexity
    async (response: Response): Promise<boolean> => {
      let endEventReceived = false

      if (!response.body) return false

      for await (const ev of parseSse(response.body)) {
        if (ev.event === SSE_EVENTS.END) {
          endEventReceived = true
          setIsStreaming(false)
          break
        }

        if (ev.event === SSE_EVENTS.ERROR) {
          setIsStreaming(false)
          const errorData: unknown =
            typeof ev.data === 'string' ? JSON.parse(ev.data) : {}
          const message: string =
            typeof errorData === 'object' &&
            errorData !== null &&
            'message' in errorData &&
            typeof errorData.message === 'string'
              ? errorData.message
              : 'An unknown error occurred during streaming.'

          setError(message)
          continue
        }

        if (ev.event !== SSE_EVENTS.MESSAGES) continue

        const parsedData = JSON.parse(ev.data)
        const [serialized, metadata] = parsedData
        const messageId = messageManagerRef.current.add(serialized, metadata)
        if (!messageId) continue

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
      }

      return endEventReceived
    },
    [],
  )

  const executeStream = useCallback(
    async (
      url: string,
      body: object,
      shouldCheckEndEvent = false,
      onRetry?: () => Promise<Result<undefined, StreamError>>,
    ) => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      setIsStreaming(true)
      setError(null)

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
        })

        if (!res.body) {
          return err({
            type: 'network' as const,
            message: ERROR_MESSAGES.FETCH_FAILED,
            status: res.status,
          })
        }

        const endEventReceived = await processSSEStream(res)

        if (shouldCheckEndEvent && !endEventReceived) {
          if (retryCountRef.current < MAX_RETRIES && onRetry) {
            retryCountRef.current++
            return onRetry()
          }
          setError('Connection timed out after multiple attempts')
        }

        setIsStreaming(false)
        retryCountRef.current = 0
        return ok(undefined)
      } catch (error) {
        setIsStreaming(false)

        if (error instanceof Error && error.name === 'AbortError') {
          return err({
            type: 'abort' as const,
            message: 'Request was aborted',
          })
        }

        retryCountRef.current = 0
        return err({
          type: 'unknown' as const,
          message: ERROR_MESSAGES.GENERAL,
        })
      }
    },
    [processSSEStream],
  )

  const replay = useCallback(async () => {
    return executeStream('/api/chat/replay', { designSessionId })
  }, [designSessionId, executeStream])

  const start = useCallback(
    async (params: ChatRequest) => {
      return executeStream('/api/chat/stream', params, true, replay)
    },
    [executeStream, replay],
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
