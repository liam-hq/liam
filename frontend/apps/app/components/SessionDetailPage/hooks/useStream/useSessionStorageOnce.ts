'use client'

import type { BaseMessage } from '@langchain/core/messages'
import {
  coerceMessageLikeToMessage,
  isHumanMessage,
} from '@langchain/core/messages'
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { LG_INITIAL_MESSAGE_PREFIX } from '../../../../constants/storageKeys'

/**
 * useStream-specific sessionStorage reading hook
 * Reads initial message once and deletes it
 */
export function useSessionStorageOnce(
  designSessionId: string,
): BaseMessage | null {
  const key = `${LG_INITIAL_MESSAGE_PREFIX}:${designSessionId}`
  const snapshotRef = useRef<BaseMessage | null>(null)
  const initializedRef = useRef(false)
  const lastKeyRef = useRef(key)

  const subscribe = useCallback((_callback: () => void) => {
    // sessionStorage does not fire events within the same tab
    return () => {}
  }, [])

  const getSnapshot = useCallback(() => {
    // Cache the snapshot to ensure stable identity across renders
    if (!initializedRef.current) {
      if (typeof window === 'undefined') {
        snapshotRef.current = null
      } else {
        const stored = sessionStorage.getItem(key)
        if (!stored) {
          snapshotRef.current = null
        } else {
          try {
            const parsed = JSON.parse(stored)
            const message = coerceMessageLikeToMessage(parsed)
            snapshotRef.current = isHumanMessage(message) ? message : null
          } catch {
            snapshotRef.current = null
          }
        }
      }
      initializedRef.current = true
    }
    return snapshotRef.current
  }, [key])

  const getServerSnapshot = useCallback(() => null, [])

  const message = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  const wasDeleted = useRef(false)

  // Reset cache if the key changes
  useEffect(() => {
    if (lastKeyRef.current !== key) {
      lastKeyRef.current = key
      initializedRef.current = false
      snapshotRef.current = null
      wasDeleted.current = false
    }
  }, [key])
  useEffect(() => {
    if (!wasDeleted.current && message !== null) {
      sessionStorage.removeItem(key)
      wasDeleted.current = true
    }
  }, [message, key])

  return message
}
