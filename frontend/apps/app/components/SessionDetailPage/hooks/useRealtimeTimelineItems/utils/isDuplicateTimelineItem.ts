import type { TimelineItemEntry } from '../../../types'

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

  if (newEntry.type === 'user') {
    const contentDuplicate = timelineItems.some((item) => {
      if (item.type !== 'user' || item.content !== newEntry.content) {
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
