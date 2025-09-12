'use client'

import type { SerializedConstructor } from '@langchain/core/load/serializable'
import {
  type BaseMessage,
  ChatMessage,
  coerceMessageLikeToMessage,
} from '@langchain/core/messages'
import { MessageTupleManager, SSE_EVENTS } from '@liam-hq/agent/client'
import { err, ok } from 'neverthrow'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ERROR_MESSAGES } from '../../components/Chat/constants/chatConstants'
import { parseSse } from './parseSse'
import { useSessionStorageOnce } from './useSessionStorageOnce'

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
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor to reduce complexity
  const start = useCallback(async (params: ChatRequest) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setIsStreaming(true)

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

      for await (const ev of parseSse(res.body)) {
        if (ev.event === SSE_EVENTS.END) {
          setIsStreaming(false)
          break
        }

        if (ev.event !== SSE_EVENTS.MESSAGES) continue

        const parsedData = JSON.parse(ev.data)
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const [serialized, metadata] = parsedData as [
          SerializedConstructor,
          Record<string, unknown>,
        ]

        // ChatMessage bypass: Handle ChatMessage directly without MessageTupleManager
        if (serialized.kwargs.role === 'operational') {
          setMessages((prev) => {
            const message = new ChatMessage({
              id: serialized.kwargs.id,
              content: serialized.kwargs.content,
              role: serialized.kwargs.role || 'operational',
              additional_kwargs: serialized.kwargs.additional_kwargs || {},
            })

            return [...prev, message]
          })

          continue
        }

        const messageId = messageManagerRef.current.add(
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          serialized.kwargs as BaseMessage,
          metadata,
        )
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

      setIsStreaming(false)
      return ok(undefined)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
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
  }, [])

  return {
    messages,
    isStreaming,
    stop,
    start,
  }
}
