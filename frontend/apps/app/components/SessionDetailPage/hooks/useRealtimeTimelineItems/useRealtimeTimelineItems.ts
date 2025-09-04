'use client'

import {
  buildingSchemaVersionsSchema,
  type Database,
  timelineItemsSchema,
} from '@liam-hq/db'
import { err, ok, type Result } from 'neverthrow'
import { useCallback, useEffect, useMemo, useState } from 'react'
import * as v from 'valibot'
import { createClient } from '../../../../libs/db/client'
import { useViewMode } from '../../hooks/viewMode'
import { convertTimelineItemToTimelineItemEntry } from '../../services/convertTimelineItemToTimelineItemEntry'
import type { TimelineItem, TimelineItemEntry } from '../../types'
import { isDuplicateTimelineItem } from './utils/isDuplicateTimelineItem'

const parseTimelineItem = (data: unknown): Result<TimelineItem, Error> => {
  const parsed = v.safeParse(timelineItemsSchema, data)
  if (!parsed.success) {
    return err(new Error('Invalid timeline item format'))
  }
  return ok(parsed.output)
}

type VersionData = {
  id: string
  number: number
  patch: Database['public']['Tables']['building_schema_versions']['Row']['patch']
}

const parseVersionData = (data: unknown): Result<VersionData, Error> => {
  const parsed = v.safeParse(buildingSchemaVersionsSchema, data)
  if (!parsed.success) {
    return err(new Error('Invalid building schema version format'))
  }
  return ok({
    id: parsed.output.id,
    number: parsed.output.number,
    patch: parsed.output.patch,
  })
}

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
  const { isPublic } = useViewMode()
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

  // Store version information separately - initialize from initial timeline items
  const [versions, setVersions] = useState<Map<string, VersionData>>(() => {
    const initialVersions = new Map<string, VersionData>()
    initialTimelineItems.forEach((item) => {
      if (item.type === 'schema_version' && item.version) {
        initialVersions.set(item.version.id, item.version)
      }
    })
    return initialVersions
  })

  // Combine timeline items with current version information
  const timelineItemsWithVersions = useMemo(() => {
    return timelineItems.map((item) => {
      if (item.type === 'schema_version' && item.buildingSchemaVersionId) {
        const version = versions.get(item.buildingSchemaVersionId)
        return {
          ...item,
          version: version || null,
        }
      }
      return item
    })
  }, [timelineItems, versions])

  // Add or update timeline item with duplicate checking and optimistic update handling
  const addOrUpdateTimelineItem = useCallback(
    (newChatEntry: TimelineItemEntry) => {
      // For public view, disable adding/updating timeline items
      if (isPublic) return

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
    [isPublic],
  )

  const handleNewTimelineItem = useCallback(
    async (newTimelineItem: TimelineItem) => {
      const timelineItemEntry =
        convertTimelineItemToTimelineItemEntry(newTimelineItem)
      addOrUpdateTimelineItem(timelineItemEntry)
    },
    [addOrUpdateTimelineItem],
  )

  useEffect(() => {
    // Skip realtime subscription for public view
    if (isPublic) return

    const supabase = createClient()

    // Subscribe to timeline_items changes
    const timelineChannel = supabase
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
          const parseResult = parseTimelineItem(payload.new)
          if (parseResult.isErr()) {
            handleError(parseResult.error)
            return
          }

          const updatedTimelineItem = parseResult.value
          if (updatedTimelineItem.design_session_id === designSessionId) {
            handleNewTimelineItem(updatedTimelineItem).catch(handleError)
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          handleError(new Error('Failed to subscribe to timeline items'))
        }
      })

    // Subscribe to building_schema_versions changes
    const versionsChannel = supabase
      .channel('building_schema_versions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'building_schema_versions',
        },
        (payload) => {
          const parseResult = parseVersionData(payload.new)
          if (parseResult.isOk()) {
            const version = parseResult.value
            setVersions((prev) => new Map(prev).set(version.id, version))
          } else {
            handleError(parseResult.error)
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          handleError(
            new Error('Failed to subscribe to building schema versions'),
          )
        }
      })

    return () => {
      timelineChannel.unsubscribe()
      versionsChannel.unsubscribe()
    }
  }, [designSessionId, handleError, handleNewTimelineItem, isPublic])

  return {
    timelineItems: timelineItemsWithVersions,
    error,
    addOrUpdateTimelineItem,
  }
}
