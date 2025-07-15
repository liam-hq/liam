import type { TimelineItemEntry } from '../../../types'

/**
 * Generate unique timeline item ID
 */
export const generateTimelineItemId = (prefix: string): string => {
  return `${prefix}-${Date.now()}`
}
