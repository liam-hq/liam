'use client'

import type { Tables } from '@liam-hq/db/supabase/database.types'
import * as v from 'valibot'
import { createClient } from '@/libs/db/client'
import type { TimelineItemEntry, TimelineItemType } from '../types'

// TODO: Make sure to use it when storing data and as an inferential type
const realtimeTimelineItemSchema = v.object({
  id: v.string(),
  design_session_id: v.pipe(v.string(), v.uuid()),
  content: v.string(),
  type: v.picklist([
    'user',
    'assistant',
    'schema_version',
    'error',
    'assistant_log',
  ]),
  user_id: v.nullable(v.string()),
  created_at: v.string(),
  updated_at: v.string(),
  organization_id: v.pipe(v.string(), v.uuid()),
  building_schema_version_id: v.nullable(v.string()),
})

export const convertTimelineItemToChatEntry = (
  timelineItem: TimelineItemType,
): TimelineItemEntry => {
  if (
    timelineItem.type === 'schema_version' &&
    'building_schema_version_id' in timelineItem &&
    typeof timelineItem.building_schema_version_id === 'string'
  )
    // Schema version timeline item
    return {
      id: timelineItem.id,
      role: timelineItem.type,
      content: timelineItem.content,
      building_schema_version_id: timelineItem.building_schema_version_id,
    }

  // Regular timeline item from Tables<'timeline_items'>
  return {
    id: timelineItem.id,
    content: timelineItem.content,
    role: timelineItem.type,
    timestamp: new Date(timelineItem.created_at),
  }
}

/**
 * Set up realtime subscription for timeline items in a design session
 */
export const setupRealtimeSubscription = (
  designSessionId: string,
  onNewTimelineItem: (timelineItem: Tables<'timeline_items'>) => void,
  onError?: (error: Error) => void,
) => {
  const supabase = createClient()

  const subscription = supabase
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
          const validatedTimelineItem = v.parse(
            realtimeTimelineItemSchema,
            payload.new,
          )
          onNewTimelineItem(validatedTimelineItem)
        } catch (error) {
          console.error(error)
          onError?.(
            error instanceof Error
              ? error
              : new Error('Invalid timeline item format or validation failed'),
          )
        }
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
      } else if (status === 'CHANNEL_ERROR') {
        onError?.(new Error('Realtime subscription failed'))
      }
    })

  return subscription
}
