'use client'

import {
  type BaseMessage,
  coerceMessageLikeToMessage,
} from '@langchain/core/messages'
import {
  type AnalyzedRequirements,
  analyzedRequirementsSchema,
  MessageTupleManager,
  SSE_EVENTS,
} from '@liam-hq/agent/client'
import { err, ok, type Result } from '@liam-hq/neverthrow'
import { useCallback, useMemo, useRef, useState } from 'react'
import { object, safeParse, string } from 'valibot'
import { useNavigationGuard } from '../../../../hooks/useNavigationGuard'
import { ERROR_MESSAGES } from '../../components/Chat/constants/chatConstants'
import {
  clearWorkflowInProgress,
  setWorkflowInProgress,
} from '../../utils/workflowStorage'
import { parseSse } from './parseSse'
import { useSessionStorageOnce } from './useSessionStorageOnce'

type StartParams = {
  userInput: string
  designSessionId: string
}

const MAX_RETRIES = 2

type ReplayParams = Pick<StartParams, 'designSessionId'>

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
  initialAnalyzedRequirements?: AnalyzedRequirements | null
}
export const useStream = ({
  designSessionId,
  initialMessages,
  initialAnalyzedRequirements,
}: Props) => {
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
  const [analyzedRequirements, setAnalyzedRequirements] =
    useState<AnalyzedRequirements | null>(initialAnalyzedRequirements ?? null)

  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)

  const completeWorkflow = useCallback((sessionId: string) => {
    setIsStreaming(false)
    abortRef.current = null
    retryCountRef.current = 0
    clearWorkflowInProgress(sessionId)
  }, [])

  const abortWorkflow = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
    abortRef.current = null
    retryCountRef.current = 0
    // Do NOT clear workflow flag - allow reconnection
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useNavigationGuard((_event) => {
    if (isStreaming) {
      abortWorkflow()
    }
    return true
  })

  const handleMessageEvent = useCallback(async (ev: { data: string }) => {
    const messageId = await messageManagerRef.current.add(ev.data)
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

  const handleAnalyzedRequirementsEvent = useCallback(
    (ev: { data: string }) => {
      const parsedData = JSON.parse(ev.data)
      const [serialized] = parsedData
      const result = safeParse(analyzedRequirementsSchema, serialized)
      if (result.success) {
        setAnalyzedRequirements(result.output)
      }
    },
    [],
  )

  const handleErrorEvent = useCallback((ev: { data: string }) => {
    setIsStreaming(false)
    setError(extractStreamErrorMessage(ev.data))
  }, [])

  const handleStreamEvent = useCallback(
    (ev: { event: string; data: string }): 'end' | 'error' | 'continue' => {
      if (ev.event === SSE_EVENTS.END) {
        setIsStreaming(false)
        return 'end'
      }

      if (ev.event === SSE_EVENTS.ERROR) {
        handleErrorEvent(ev)
        return 'error'
      }

      if (ev.event === SSE_EVENTS.MESSAGES) {
        handleMessageEvent(ev)
      }

      if (ev.event === SSE_EVENTS.ANALYZED_REQUIREMENTS) {
        handleAnalyzedRequirementsEvent(ev)
      }

      return 'continue'
    },
    [handleMessageEvent, handleAnalyzedRequirementsEvent, handleErrorEvent],
  )

  const processStreamEvents = useCallback(
    async (res: Response): Promise<boolean> => {
      if (!res.body) return false

      let endEventReceived = false

      for await (const ev of parseSse(res.body)) {
        const result = handleStreamEvent(ev)
        if (result === 'end') {
          endEventReceived = true
          break
        }
        if (result === 'error') {
        }
      }

      return endEventReceived
    },
    [handleStreamEvent],
  )

  const runStreamAttempt = useCallback(
    async (
      endpoint: string,
      params: StartParams | ReplayParams,
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
          body: JSON.stringify(params),
          signal: controller.signal,
        })

        if (!res.body) {
          abortWorkflow()
          return err({
            type: 'network',
            message: ERROR_MESSAGES.FETCH_FAILED,
            status: res.status,
          })
        }

        const endEventReceived = await processStreamEvents(res)

        if (!endEventReceived) {
          if (controller.signal.aborted) {
            abortWorkflow()
            return err({
              type: 'abort',
              message: 'Request was aborted',
            })
          }

          controller.abort()
          abortRef.current = null
          return ok('shouldRetry')
        }

        completeWorkflow(params.designSessionId)
        return ok('complete')
      } catch (unknownError) {
        abortWorkflow()

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
    [completeWorkflow, abortWorkflow, processStreamEvents],
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
      abortWorkflow()
      setError(timeoutMessage)
      return err({
        type: 'timeout',
        message: timeoutMessage,
      })
    },
    [abortWorkflow, runStreamAttempt],
  )

  const start = useCallback(
    async (params: StartParams): Promise<Result<void, StreamError>> => {
      abortRef.current?.abort()
      retryCountRef.current = 0

      // Set workflow in progress flag
      setWorkflowInProgress(params.designSessionId)

      const result = await runStreamAttempt('/api/chat/stream', params)

      if (result.isErr()) {
        return err(result.error)
      }

      if (result.value === 'complete') {
        return ok(undefined)
      }

      return replay({
        designSessionId: params.designSessionId,
      })
    },
    [replay, runStreamAttempt],
  )

  return {
    messages,
    setMessages,
    analyzedRequirements,
    isStreaming,
    error,
    start,
    replay,
    clearError,
  }
}
