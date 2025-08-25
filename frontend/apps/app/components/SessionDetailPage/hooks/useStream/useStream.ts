import type { BaseMessage } from '@langchain/core/messages'
import type { Message } from '@langchain/langgraph-sdk'
import { err, ok } from 'neverthrow'
import { useCallback, useRef, useState } from 'react'
import { ERROR_MESSAGES } from '../../components/Chat/constants/chatConstants'
import { MessageTupleManager } from './MessageTupleManager'
import { parseSse } from './parseSse'

const toMessageDict = (chunk: BaseMessage): Message => {
  const { type, data } = chunk.toDict()
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { ...data, type } as Message
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
export const useStream = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const messageManagerRef = useRef(new MessageTupleManager())

  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

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
        if (ev.event !== 'messages') continue

        const parsedData = JSON.parse(ev.data)
        const [serialized, metadata] = parsedData
        const messageId = messageManagerRef.current.add(serialized, metadata)
        if (!messageId) continue

        setMessages((prev) => {
          const newMessages = [...prev]
          const { chunk, index } =
            messageManagerRef.current.get(messageId, prev.length) ?? {}

          if (!chunk) return newMessages

          const message = toMessageDict(chunk)
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
