'use client'

import type { ToolMessage as ToolMessageType } from '@langchain/core/messages'
import type { ToolCalls as ToolCallsType } from '@liam-hq/agent/client'
import { type FC, useEffect, useState } from 'react'
import { ToolCallCard } from './ToolCallCard'
import styles from './ToolCalls.module.css'

type ToolCall = ToolCallsType[number]

type ToolCallWithMessage = {
  toolCall: ToolCall
  toolMessage?: ToolMessageType
}

type Props = {
  toolCallsWithMessages: ToolCallWithMessage[]
  isStreaming?: boolean
  onNavigate: (tab: 'erd' | 'artifact') => void
}

type ToolCallStatus = 'pending' | 'running' | 'completed' | 'error'

type ToolCallState = {
  status: ToolCallStatus
  error?: string
}

// Helper functions
const createCancellableWait = (
  ms: number,
  abortController: AbortController,
  cancelled: { value: boolean },
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (!cancelled.value) {
        resolve()
      } else {
        reject(new Error('Cancelled'))
      }
    }, ms)
    abortController.signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new Error('Cancelled'))
    })
  })
}

const shouldSkipToolCall = (state: ToolCallState | undefined): boolean => {
  return state?.status === 'completed' || state?.status === 'error'
}

const shouldSkipStateUpdate = (state: ToolCallState | undefined): boolean => {
  return (
    state?.status === 'running' ||
    state?.status === 'completed' ||
    state?.status === 'error'
  )
}

export const ToolCalls: FC<Props> = ({
  toolCallsWithMessages,
  isStreaming = false, // Default to false for loaded sessions
  onNavigate,
}) => {
  const [toolCallStates, setToolCallStates] = useState<
    Record<string, ToolCallState>
  >({})

  // Initialize tool call states
  useEffect(() => {
    const newStates: Record<string, ToolCallState> = {}
    toolCallsWithMessages.forEach(({ toolCall: tc }) => {
      if (!toolCallStates[tc.id]) {
        // If not streaming (loading existing session), show as completed immediately
        // If streaming (new execution), start with pending for animation
        const initialStatus = isStreaming ? 'pending' : 'completed'
        newStates[tc.id] = {
          status: initialStatus,
        }
      }
    })
    if (Object.keys(newStates).length > 0) {
      setToolCallStates((prev) => ({ ...prev, ...newStates }))
    }
  }, [toolCallsWithMessages, isStreaming, toolCallStates])

  // Execute tools sequentially - Only for streaming
  useEffect(() => {
    // Only run tools if streaming
    if (!isStreaming) return

    // Create an AbortController for cancellation
    const abortController = new AbortController()
    const cancelled = { value: false }

    const updateToRunning = (tc: ToolCall) => {
      setToolCallStates((prev) => {
        if (cancelled.value || shouldSkipStateUpdate(prev[tc.id])) {
          return prev
        }
        return {
          ...prev,
          [tc.id]: { ...prev[tc.id], status: 'running' },
        }
      })
    }

    const updateToCompleted = (tc: ToolCall) => {
      setToolCallStates((prev) => {
        if (cancelled.value) return prev
        return {
          ...prev,
          [tc.id]: {
            ...prev[tc.id],
            status: 'completed',
          },
        }
      })
    }

    const processToolCall = async (
      tc: ToolCall,
      wait: (ms: number) => Promise<void>,
    ): Promise<boolean> => {
      await wait(1000)
      if (cancelled.value) return false

      updateToRunning(tc)

      const executionTime = isStreaming ? 5000 : 2000
      await wait(executionTime)
      if (cancelled.value) return false

      updateToCompleted(tc)
      return true
    }

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Animation sequencing requires complex logic
    const runTools = async () => {
      const wait = (ms: number) =>
        createCancellableWait(ms, abortController, cancelled)

      for (const { toolCall: tc } of toolCallsWithMessages) {
        if (cancelled.value || shouldSkipToolCall(toolCallStates[tc.id])) {
          continue
        }

        try {
          const success = await processToolCall(tc, wait)
          if (!success) break
        } catch {
          break
        }
      }
    }

    // Run for all tools to show animation
    if (toolCallsWithMessages.length > 0) {
      runTools()
    }

    // Cleanup function
    return () => {
      cancelled.value = true
      abortController.abort()
    }
  }, [toolCallsWithMessages, isStreaming, toolCallStates])

  if (toolCallsWithMessages.length === 0) return null

  return (
    <div className={styles.container}>
      {toolCallsWithMessages.map(({ toolCall: tc, toolMessage }) => {
        const state = toolCallStates[tc.id] || { status: 'pending' }
        return (
          <ToolCallCard
            key={tc.id}
            toolCall={tc}
            status={state.status}
            error={state.error}
            toolMessage={toolMessage}
            onNavigate={onNavigate}
          />
        )
      })}
    </div>
  )
}
