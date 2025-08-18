'use client'

import type { TimelineItemEntry } from '../types'

export function usePublicRealtimeTimelineItems(
  _designSessionId: string,
  initialTimelineItems: TimelineItemEntry[],
) {
  // TODO: Consider enabling realtime updates for public view
  // Currently returns static data from initial load
  return {
    timelineItems: initialTimelineItems,
    addOrUpdateTimelineItem: () => {},
  }
}
