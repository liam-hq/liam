import type { CustomStreamEvent } from '@liam-hq/agent/client'
import { err, ok, type Result } from 'neverthrow'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ERROR_MESSAGES } from '../../components/Chat/constants/chatConstants'
import type { AssistantTimelineItemEntry, TimelineItemEntry } from '../../types'
import { parseCustomStreamEvents } from './parseCustomStreamEvents'

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

type Params = {
  initialTimelineItems: TimelineItemEntry[]
}

export const useStream = ({ initialTimelineItems }: Params) => {
  const [timelineItemsMap, setTimelineItemsMap] = useState<
    Map<string, TimelineItemEntry>
  >(() => {
    const map = new Map<string, TimelineItemEntry>()
    initialTimelineItems.forEach((item) => map.set(item.id, item))
    return map
  })

  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleStreamEvent = useCallback((event: CustomStreamEvent) => {
    if (event.event === 'delta' && event.data) {
      const { runId, content, role } = event.data

      if (content && runId && role) {
        setTimelineItemsMap((prevMap) => {
          const newMap = new Map(prevMap)
          const existingItem = newMap.get(runId)

          if (existingItem && existingItem.type === 'assistant') {
            const assistantItem = existingItem
            newMap.set(runId, {
              ...assistantItem,
              content: assistantItem.content + content,
            })
          } else {
            const newItem: AssistantTimelineItemEntry = {
              id: runId,
              type: 'assistant',
              role,
              content,
              timestamp: new Date(),
            }
            newMap.set(runId, newItem)
          }

          return newMap
        })
      }
    }
  }, [])

  const timelineItems = useMemo(() => {
    return Array.from(timelineItemsMap.values()).sort((a, b) => {
      const aTime = a.timestamp?.getTime() ?? 0
      const bTime = b.timestamp?.getTime() ?? 0
      return aTime - bTime
    })
  }, [timelineItemsMap])

  const start = useCallback(
    async (params: ChatRequest): Promise<Result<void, StreamError>> => {
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

        for await (const ev of parseCustomStreamEvents(res.body)) {
          handleStreamEvent(ev)
        }

        // Stream completed successfully
        setIsStreaming(false)
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
    [handleStreamEvent],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  return {
    timelineItems,
    isStreaming,
    start,
    stop,
  }
}
