import { describe, expect, it } from 'vitest'
import type { TimelineItemEntry } from '../types/chatTypes'
import {
  formatTimelineItemHistory,
  isDuplicateTimelineItem,
} from './timelineItemHelpers'

describe('timelineItemHelpers', () => {
  describe('formatTimelineItemHistory', () => {
    it('should format timeline items for API', () => {
      const timelineItems: TimelineItemEntry[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date(),
        },
      ]

      const result = formatTimelineItemHistory(timelineItems)

      expect(result).toEqual([
        ['Human', 'Hello'],
        ['AI', 'Hi there!'],
      ])
    })
  })

  describe('isDuplicateTimelineItem', () => {
    const baseTimelineItem: TimelineItemEntry = {
      id: '1',
      role: 'user',
      content: 'Hello world',
      timestamp: new Date('2024-01-01T10:00:00Z'),
    }

    const existingItems: TimelineItemEntry[] = [baseTimelineItem]

    it('should detect duplicate by ID', () => {
      const newEntry: TimelineItemEntry = {
        id: '1',
        role: 'assistant',
        content: 'Different content',
        timestamp: new Date('2024-01-01T11:00:00Z'),
      }

      const result = isDuplicateTimelineItem(existingItems, newEntry)
      expect(result).toBe(true)
    })

    it('should not detect duplicate for different ID', () => {
      const newEntry: TimelineItemEntry = {
        id: '2',
        role: 'assistant',
        content: 'Different content',
        timestamp: new Date('2024-01-01T11:00:00Z'),
      }

      const result = isDuplicateTimelineItem(existingItems, newEntry)
      expect(result).toBe(false)
    })

    it('should detect content duplicate for user messages within timestamp tolerance', () => {
      const newEntry: TimelineItemEntry = {
        id: '2',
        role: 'user',
        content: 'Hello world',
        timestamp: new Date('2024-01-01T10:00:03Z'),
      }

      const result = isDuplicateTimelineItem(existingItems, newEntry)
      expect(result).toBe(true)
    })

    it('should not detect content duplicate for user messages outside timestamp tolerance', () => {
      const newEntry: TimelineItemEntry = {
        id: '2',
        role: 'user',
        content: 'Hello world',
        timestamp: new Date('2024-01-01T10:00:06Z'),
      }

      const result = isDuplicateTimelineItem(existingItems, newEntry)
      expect(result).toBe(false)
    })

    it('should detect content duplicate for user messages when either has no timestamp', () => {
      const itemsWithoutTimestamp: TimelineItemEntry[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello world',
        },
      ]

      const newEntry: TimelineItemEntry = {
        id: '2',
        role: 'user',
        content: 'Hello world',
        timestamp: new Date('2024-01-01T10:00:00Z'),
      }

      const result = isDuplicateTimelineItem(itemsWithoutTimestamp, newEntry)
      expect(result).toBe(true)
    })

    it('should not detect content duplicate for different user message content', () => {
      const newEntry: TimelineItemEntry = {
        id: '2',
        role: 'user',
        content: 'Different message',
        timestamp: new Date('2024-01-01T10:00:01Z'),
      }

      const result = isDuplicateTimelineItem(existingItems, newEntry)
      expect(result).toBe(false)
    })

    it('should not detect content duplicate for non-user messages', () => {
      const newEntry: TimelineItemEntry = {
        id: '2',
        role: 'assistant',
        content: 'Hello world',
        timestamp: new Date('2024-01-01T10:00:01Z'),
      }

      const result = isDuplicateTimelineItem(existingItems, newEntry)
      expect(result).toBe(false)
    })

    it('should handle empty timeline items array', () => {
      const newEntry: TimelineItemEntry = {
        id: '1',
        role: 'user',
        content: 'Hello world',
        timestamp: new Date(),
      }

      const result = isDuplicateTimelineItem([], newEntry)
      expect(result).toBe(false)
    })

    it('should handle schema_version role', () => {
      const schemaVersionEntry: TimelineItemEntry = {
        id: '1',
        role: 'schema_version',
        content: 'Schema updated',
        building_schema_version_id: 'version-1',
      }

      const newEntry: TimelineItemEntry = {
        id: '2',
        role: 'schema_version',
        content: 'Schema updated',
        building_schema_version_id: 'version-2',
      }

      const result = isDuplicateTimelineItem([schemaVersionEntry], newEntry)
      expect(result).toBe(false)
    })

    it('should handle exact timestamp boundary (5 seconds)', () => {
      const newEntry: TimelineItemEntry = {
        id: '2',
        role: 'user',
        content: 'Hello world',
        timestamp: new Date('2024-01-01T10:00:05Z'),
      }

      const result = isDuplicateTimelineItem(existingItems, newEntry)
      expect(result).toBe(false)
    })

    it('should handle timestamp just within tolerance (4.999 seconds)', () => {
      const newEntry: TimelineItemEntry = {
        id: '2',
        role: 'user',
        content: 'Hello world',
        timestamp: new Date('2024-01-01T10:00:04.999Z'),
      }

      const result = isDuplicateTimelineItem(existingItems, newEntry)
      expect(result).toBe(true)
    })
  })
})
