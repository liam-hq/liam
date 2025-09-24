'use client'

import {
  type BaseMessage,
  coerceMessageLikeToMessage,
} from '@langchain/core/messages'
import { MessageTupleManager, SSE_EVENTS } from '@liam-hq/agent/client'
import { err, ok } from 'neverthrow'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigationGuard } from '../../../../hooks/useNavigationGuard'
import { ERROR_MESSAGES } from '../../components/Chat/constants/chatConstants'
import { parseSse } from './parseSse'
import { useSessionStorageOnce } from './useSessionStorageOnce'

const MAX_RETRIES = 2

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

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor to reduce complexity
  const start = useCallback(async (params: ChatRequest) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setIsStreaming(true)
    setError(null) // Clear error when starting new request

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: abortRef.current.signal,
      })

      if (!res.body) {
        return err({
          type: 'network',
          message: ERROR_MESSAGES.FETCH_FAILED,
          status: res.status,
        })
      }

      let endEventReceived = false

      for await (const ev of parseSse(res.body)) {
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

          // Set error state
          setError(message)
          continue // Continue streaming even with error
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

      // Detect potential forced disconnection
      if (!endEventReceived) {
        // Retry logic
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++
          return start(params)
        }

        // Final failure after all retries
        setError('Connection timed out after multiple attempts')
      }

      setIsStreaming(false)
      retryCountRef.current = 0 // Reset retry counter on success
      return ok(undefined)
    } catch (error) {
      setIsStreaming(false)

      if (error instanceof Error && error.name === 'AbortError') {
        return err({
          type: 'abort',
          message: 'Request was aborted',
        })
      }

      retryCountRef.current = 0 // Reset retry counter on error
      return err({
        type: 'unknown',
        message: ERROR_MESSAGES.GENERAL,
      })
    }
  }, [])

  return {
    messages,
    isStreaming,
    error,
    stop,
    start,
    clearError,
  }
}
