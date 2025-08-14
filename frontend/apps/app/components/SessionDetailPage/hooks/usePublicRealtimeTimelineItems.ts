'use client'

import type { TimelineItemEntry } from '../types'

export function usePublicRealtimeTimelineItems(
  _designSessionId: string,
  initialTimelineItems: TimelineItemEntry[],
) {
  // Public view does not support realtime updates
  // Return initial data without any updates
  return {
    timelineItems: initialTimelineItems,
    addOrUpdateTimelineItem: () => {},
  }
}
