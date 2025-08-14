import { err, ok, type Result } from 'neverthrow'
import { useCallback, useRef, useState } from 'react'
import { ERROR_MESSAGES } from '../../components/Chat/constants/chatConstants'
import type { TimelineItemEntry } from '../../types'

type ChatRequest = {
  userInput: string
  designSessionId: string
  isDeepModelingEnabled: boolean
}

type StreamError = {
  type: 'network' | 'abort' | 'unknown'
  message: string
  status?: number
}

// TODO: Consider using useStream from '@langchain/langgraph-sdk/react'
export const useStream = () => {
  // NOTE: It might be better to manage with messages/values to align with the design of useStream from '@langchain/langgraph-sdk/react'
  const [timelineItems, setTimelineItems] = useState<TimelineItemEntry[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // TODO: Support resuming from checkpoint
  const start = useCallback(
    async (params: ChatRequest): Promise<Result<void, StreamError>> => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      setTimelineItems([])
      setIsStreaming(true)

      try {
        const res = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
          signal: abortRef.current.signal,
        })

        if (!res.ok) {
          setIsStreaming(false)
          return err({
            type: 'network',
            message: ERROR_MESSAGES.FETCH_FAILED,
            status: res.status,
          })
        }

        if (!res.body) {
          setIsStreaming(false)
          return err({
            type: 'network',
            message: ERROR_MESSAGES.RESPONSE_NOT_READABLE,
            status: res.status,
          })
        }

        // TODO: Convert ReadableStream to TimelineItemEntry[]
        return ok(undefined)
      } catch (error) {
        setIsStreaming(false)
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
    },
    [],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setTimelineItems([])
  }, [])

  return {
    timelineItems,
    isStreaming,
    start,
    stop,
  }
}
