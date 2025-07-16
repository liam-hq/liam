'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { TimelineItemEntry } from '../../../types'
import {
  hasInProgressTasks,
  markTasksAsCompleted,
  markTasksAsFailed,
} from '../utils/taskProgress'

type UseProgressiveMessageProps = {
  onUpdateMessage: (entry: TimelineItemEntry) => void
}

/**
 * Hook to handle progressive message updates
 * This enables updating task status from in-progress to completed/failed
 */
export const useProgressiveMessage = ({
  onUpdateMessage,
}: UseProgressiveMessageProps) => {
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  /**
   * Update a message's content with completed tasks
   */
  const completeTasksInMessage = useCallback(
    (entry: TimelineItemEntry) => {
      if (!hasInProgressTasks(entry.content)) return

      const updatedContent = markTasksAsCompleted(entry.content)
      const updatedEntry: TimelineItemEntry = {
        ...entry,
        content: updatedContent,
      }
      onUpdateMessage(updatedEntry)
    },
    [onUpdateMessage],
  )

  /**
   * Update a message's content with failed tasks
   */
  const failTasksInMessage = useCallback(
    (entry: TimelineItemEntry) => {
      if (!hasInProgressTasks(entry.content)) return

      const updatedContent = markTasksAsFailed(entry.content)
      const updatedEntry: TimelineItemEntry = {
        ...entry,
        content: updatedContent,
      }
      onUpdateMessage(updatedEntry)
    },
    [onUpdateMessage],
  )

  /**
   * Simulate task completion after a delay
   * In production, this would be triggered by server events
   */
  const simulateTaskCompletion = useCallback(
    (entry: TimelineItemEntry, delay = 3000) => {
      if (!hasInProgressTasks(entry.content)) return

      // Clear existing timeout if any
      const existingTimeout = timeoutRefs.current.get(entry.id)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        completeTasksInMessage(entry)
        timeoutRefs.current.delete(entry.id)
      }, delay)

      timeoutRefs.current.set(entry.id, timeout)
    },
    [completeTasksInMessage],
  )

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout))
      timeoutRefs.current.clear()
    }
  }, [])

  return {
    completeTasksInMessage,
    failTasksInMessage,
    simulateTaskCompletion,
  }
}
