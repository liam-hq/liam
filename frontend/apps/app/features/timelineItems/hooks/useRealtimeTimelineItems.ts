import type { Tables } from '@liam-hq/db/supabase/database.types'
import { useCallback, useEffect, useState } from 'react'
import { isDuplicateTimelineItem } from '../services/timelineItemHelpers'
import {
  convertTimelineItemToChatEntry,
  setupRealtimeSubscription,
} from '../services/timelineItemServiceClient'
import type { TimelineItemEntry, TimelineItemType } from '../types'

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
  if (newEntry.role !== 'user') {
    return null
  }

  // Find optimistic timeline item (user timeline item with temporary ID) that matches content
  const optimisticIndex = timelineItems.findIndex(
    (item) =>
      item.role === 'user' &&
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

type UseRealtimeTimelineItemsFunc = (
  designSessionId: string,
  timelineItems: TimelineItemType[],
) => {
  timelineItems: TimelineItemEntry[]
  addOrUpdateTimelineItem: (newChatEntry: TimelineItemEntry) => void
}

export const useRealtimeTimelineItems: UseRealtimeTimelineItemsFunc = (
  designSessionId,
  _timelineItems,
) => {
  // Initialize timeline items with existing timeline items (no welcome message)
  const initialTimelineItems = _timelineItems.map((item) => {
    return convertTimelineItemToChatEntry(item)
  })

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

  // Handle new timeline items from realtime subscription
  const handleNewTimelineItem = useCallback(
    (newTimelineItem: Tables<'timeline_items'>) => {
      // Convert database timeline item to TimelineItemEntry format
      const timelineItemEntry = convertTimelineItemToChatEntry(newTimelineItem)

      // TODO: Implement efficient duplicate checking - Use Set/Map for O(1) duplicate checking instead of O(n) array.some()
      // TODO: Implement smart auto-scroll - Consider user's scroll position and only auto-scroll when user is at bottom

      addOrUpdateTimelineItem(timelineItemEntry)
    },
    [addOrUpdateTimelineItem],
  )

  // TODO: Implement comprehensive error handling - Add user notifications, retry logic, and distinguish between fatal/temporary errors
  const handleRealtimeError = useCallback((_error: Error) => {
    // TODO: Add user notification system and automatic retry mechanism
    // console.error('Realtime subscription error:', error)
  }, [])

  // TODO: Add network failure handling - Implement reconnection logic and offline timeline item sync
  // TODO: Add authentication/authorization validation - Verify user permissions for realtime subscription
  // Set up realtime subscription for new timeline items
  useEffect(() => {
    const subscription = setupRealtimeSubscription(
      designSessionId,
      handleNewTimelineItem,
      handleRealtimeError,
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [designSessionId, handleNewTimelineItem, handleRealtimeError])

  return {
    timelineItems,
    addOrUpdateTimelineItem,
  }
}
