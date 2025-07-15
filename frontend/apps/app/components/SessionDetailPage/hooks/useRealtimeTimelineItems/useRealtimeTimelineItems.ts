'use client'

import { useCallback, useEffect, useState } from 'react'
import * as v from 'valibot'
import { createClient } from '@/libs/db/client'
import { timelineItemSchema } from '../../schema'
import { convertTimelineItemToTimelineItemEntry } from '../../services/convertTimelineItemToTimelineItemEntry'
import type { TimelineItem, TimelineItemEntry } from '../../types'
import { isDuplicateTimelineItem } from './utils/isDuplicateTimelineItem'

const findExistingTimelineItemIndex = (
  timelineItems: TimelineItemEntry[],
  newEntry: TimelineItemEntry,
): number => {
  return timelineItems.findIndex((item) => item.id === newEntry.id)
}

const updateExistingTimelineItem = (
  timelineItems: TimelineItemEntry[],
  index: number,
  newEntry: TimelineItemEntry,
): TimelineItemEntry[] => {
  const updated = [...timelineItems]
  updated[index] = newEntry
  return updated
}

const handleOptimisticUserUpdate = (
  timelineItems: TimelineItemEntry[],
  newEntry: TimelineItemEntry,
): TimelineItemEntry[] | null => {
  if (newEntry.type !== 'user') {
    return null
  }

  // Find optimistic timeline item (user timeline item with temporary ID) that matches content
  const optimisticIndex = timelineItems.findIndex(
    (item) =>
      item.type === 'user' &&
      item.content === newEntry.content &&
      item.id !== newEntry.id,
  )

  if (optimisticIndex >= 0) {
    // Replace the optimistic timeline item with the persisted one
    const updated = [...timelineItems]
    updated[optimisticIndex] = newEntry
    return updated
  }

  return null
}

export function useRealtimeTimelineItems(
  designSessionId: string,
  initialTimelineItems: TimelineItemEntry[],
) {
  const [error, setError] = useState<Error | null>(null)
  const handleError = useCallback((err: unknown) => {
    setError(
      err instanceof Error
        ? err
        : new Error('Realtime versions update processing failed'),
    )
  }, [])

  const [timelineItems, setTimelineItems] =
    useState<TimelineItemEntry[]>(initialTimelineItems)

  // Add or update timeline item with duplicate checking and optimistic update handling
  const addOrUpdateTimelineItem = useCallback(
    (newChatEntry: TimelineItemEntry) => {
      setTimelineItems((prev) => {
        // Check if we need to update an existing timeline item by its temporary ID
        // This handles streaming updates and other in-place updates
        const existingTimelineItemIndex = findExistingTimelineItemIndex(
          prev,
          newChatEntry,
        )
        if (existingTimelineItemIndex >= 0) {
          return updateExistingTimelineItem(
            prev,
            existingTimelineItemIndex,
            newChatEntry,
          )
        }

        // Check if timeline item already exists to prevent duplicates
        if (isDuplicateTimelineItem(prev, newChatEntry)) {
          return prev
        }

        // Handle optimistic updates for user timeline items
        const optimisticUpdate = handleOptimisticUserUpdate(prev, newChatEntry)
        if (optimisticUpdate) {
          return optimisticUpdate
        }

        // For new timeline items (AI timeline items from realtime or timeline items from other users), add them to the chat
        return [...prev, newChatEntry]
      })
    },
    [],
  )

  const handleNewTimelineItem = useCallback(
    (newTimelineItem: TimelineItem) => {
      const timelineItemEntry =
        convertTimelineItemToTimelineItemEntry(newTimelineItem)

      // TODO: Implement efficient duplicate checking - Use Set/Map for O(1) duplicate checking instead of O(n) array.some()
      // TODO: Implement smart auto-scroll - Consider user's scroll position and only auto-scroll when user is at bottom
      addOrUpdateTimelineItem(timelineItemEntry)
    },
    [addOrUpdateTimelineItem],
  )

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`timeline_items:${designSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timeline_items',
          filter: `design_session_id=eq.${designSessionId}`,
        },
        (payload) => {
          try {
            const parsed = v.safeParse(timelineItemSchema, payload.new)
            if (!parsed.success) {
              throw new Error('Invalid timeline item format')
            }

            const updatedTimelineItem = parsed.output
            if (updatedTimelineItem.design_session_id === designSessionId) {
              handleNewTimelineItem(updatedTimelineItem)
            }
          } catch (error) {
            handleError(error)
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          handleError(new Error('Failed to subscribe to timeline items'))
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [designSessionId, handleError, handleNewTimelineItem])

  return {
    timelineItems,
    error,
    addOrUpdateTimelineItem,
  }
}
