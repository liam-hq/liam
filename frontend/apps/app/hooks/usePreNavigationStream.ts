'use client'

import { HumanMessage } from '@langchain/core/messages'
import { useCallback } from 'react'
import { setWorkflowInProgress } from '../components/SessionDetailPage/utils/workflowStorage'
import { LG_INITIAL_MESSAGE_PREFIX } from '../constants/storageKeys'
import { useStreamingContext } from '../contexts/StreamingContext'

type StartStreamParams = {
  userInput: string
  designSessionId: string
  userName?: string
}

/**
 * Hook for starting streaming before page navigation
 * This allows the API request to begin while the page transition is happening
 */
export const usePreNavigationStream = () => {
  const { createSession, updateSession } = useStreamingContext()

  const startStreamBeforeNavigation = useCallback(
    async (params: StartStreamParams) => {
      const { userInput, designSessionId, userName } = params

      const humanMessage = new HumanMessage({
        id: crypto.randomUUID(),
        content: userInput,
        additional_kwargs: userName ? { userName } : {},
      })

      sessionStorage.setItem(
        `${LG_INITIAL_MESSAGE_PREFIX}:${designSessionId}`,
        JSON.stringify(humanMessage),
      )

      createSession(designSessionId, [humanMessage], null)

      // Set workflow in progress flag
      setWorkflowInProgress(designSessionId)

      const controller = new AbortController()
      updateSession(designSessionId, {
        isStreaming: true,
        abortController: controller,
      })

      fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          designSessionId,
        }),
        signal: controller.signal,
      }).catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Pre-navigation stream error:', error)
        }
      })

      return designSessionId
    },
    [createSession, updateSession],
  )

  return { startStreamBeforeNavigation }
}
