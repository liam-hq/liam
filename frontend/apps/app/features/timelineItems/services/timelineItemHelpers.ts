import type { TimelineItemEntry } from '../types'

/**
 * Generate unique timeline item ID
 */
export const generateTimelineItemId = (prefix: string): string => {
  return `${prefix}-${Date.now()}`
}

/**
 * Format timeline item history for API
 */
export const formatTimelineItemHistory = (
  timelineItems: TimelineItemEntry[],
): [string, string][] => {
  return timelineItems.map((item) => [
    item.role === 'user' ? 'Human' : 'AI',
    item.content,
  ])
}

/**
 * Check if a timeline item is a duplicate based on ID or content/timestamp
 */
export const isDuplicateTimelineItem = (
  timelineItems: TimelineItemEntry[],
  newEntry: TimelineItemEntry,
): boolean => {
  const duplicateById = timelineItems.some((item) => item.id === newEntry.id)
  if (duplicateById) {
    return true
  }

  if (newEntry.role === 'user') {
    const contentDuplicate = timelineItems.some((item) => {
      if (item.role !== 'user' || item.content !== newEntry.content) {
        return false
      }

      if (item.timestamp && newEntry.timestamp) {
        const timeDiff = Math.abs(
          newEntry.timestamp.getTime() - item.timestamp.getTime(),
        )
        return timeDiff < 5000
      }

      return true
    })

    if (contentDuplicate) {
      return true
    }
  }

  return false
}
