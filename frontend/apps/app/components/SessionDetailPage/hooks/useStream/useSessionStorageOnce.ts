'use client'

import type { BaseMessage } from '@langchain/core/messages'
import {
  coerceMessageLikeToMessage,
  isHumanMessage,
} from '@langchain/core/messages'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { LG_INITIAL_MESSAGE_PREFIX } from '../../../../constants/storageKeys'

/**
 * useStream-specific sessionStorage reading hook
 * Reads initial message once and deletes it
 */
export function useSessionStorageOnce(
  designSessionId: string,
): BaseMessage | null {
  const key = `${LG_INITIAL_MESSAGE_PREFIX}:${designSessionId}`

  const subscribe = (_callback: () => void) => {
    // sessionStorage does not fire events within the same tab
    return () => {}
  }

  const getSnapshot = () => {
    if (typeof window === 'undefined') return null
    const stored = sessionStorage.getItem(key)
    if (!stored) return null

    try {
      const parsed = JSON.parse(stored)
      const message = coerceMessageLikeToMessage(parsed)
      return isHumanMessage(message) ? message : null
    } catch {
      return null
    }
  }

  const getServerSnapshot = () => null

  const message = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  const wasDeleted = useRef(false)
  useEffect(() => {
    if (!wasDeleted.current && message !== null) {
      sessionStorage.removeItem(key)
      wasDeleted.current = true
    }
  }, [message, key])

  return message
}
