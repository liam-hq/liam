import type { Database, Tables } from '@liam-hq/db/supabase/database.types'
import { useCallback, useEffect, useState } from 'react'
import {
  convertTimelineItemToChatEntry,
  isDuplicateTimelineItem,
  setupRealtimeSubscription,
} from '../services'
import type { TimelineItemEntry } from '../types/chatTypes'

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
  timelineItemUserId: string | null | undefined,
  currentUserId: string | null | undefined,
): TimelineItemEntry[] | null => {
  if (newEntry.role !== 'user' || timelineItemUserId !== currentUserId) {
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

export type TimelineItemType =
  | {
      id: string
      content: string
      type: Database['public']['Enums']['timeline_item_type_enum']
      user_id: string | null
      created_at: string
      updated_at: string
      organization_id: string
      design_session_id: string
      building_schema_version_id: string | null
      progress: number | null
    }
  | {
      id: string
      type: 'schema_version'
      content: string
      building_schema_version_id: string
    }
  | {
      id: string
      type: 'progress'
      content: string
      progress: number
    }

type UseRealtimeTimelineItemsFunc = (
  designSession: {
    id: string
    timelineItems: TimelineItemType[]
  },
  currentUserId?: string | null,
) => {
  timelineItems: TimelineItemEntry[]
  addOrUpdateTimelineItem: (
    newChatEntry: TimelineItemEntry,
    timelineItemUserId?: string | null | undefined,
  ) => void
}

export const useRealtimeTimelineItems: UseRealtimeTimelineItemsFunc = (
  designSession,
  currentUserId,
) => {
  // Initialize timeline items with existing timeline items (no welcome message)
  const initialTimelineItems = designSession.timelineItems.map((item) => {
    return convertTimelineItemToChatEntry(item)
  })

  const [timelineItems, setTimelineItems] =
    useState<TimelineItemEntry[]>(initialTimelineItems)

  // Add or update timeline item with duplicate checking and optimistic update handling
  const addOrUpdateTimelineItem = useCallback(
    (newChatEntry: TimelineItemEntry, timelineItemUserId?: string | null) => {
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
        const optimisticUpdate = handleOptimisticUserUpdate(
          prev,
          newChatEntry,
          timelineItemUserId ?? null,
          currentUserId,
        )
        if (optimisticUpdate) {
          return optimisticUpdate
        }

        // For new timeline items (AI timeline items from realtime or timeline items from other users), add them to the chat
        return [...prev, newChatEntry]
      })
    },
    [currentUserId],
  )

  // Handle new timeline items from realtime subscription
  const handleNewTimelineItem = useCallback(
    (newTimelineItem: Tables<'timeline_items'>) => {
      // Convert database timeline item to TimelineItemEntry format
      const timelineItemEntry = convertTimelineItemToChatEntry(newTimelineItem)

      addOrUpdateTimelineItem(
        timelineItemEntry,
        newTimelineItem.user_id ?? null,
      )
    },
    [addOrUpdateTimelineItem],
  )

  const handleRealtimeError = useCallback((_error: Error) => {
    // console.error('Realtime subscription error:', error)
  }, [])

  // Set up realtime subscription for new timeline items
  useEffect(() => {
    if (currentUserId === null) {
      return
    }

    const subscription = setupRealtimeSubscription(
      designSession.id,
      handleNewTimelineItem,
      handleRealtimeError,
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [
    designSession.id,
    currentUserId,
    handleNewTimelineItem,
    handleRealtimeError,
  ])

  return {
    timelineItems,
    addOrUpdateTimelineItem,
  }
}
