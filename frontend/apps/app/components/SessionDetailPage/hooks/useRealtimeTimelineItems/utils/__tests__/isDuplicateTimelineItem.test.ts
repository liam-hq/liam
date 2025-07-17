import { describe, expect, it } from 'vitest'
import type { TimelineItemEntry } from '../../../../types'
import { isDuplicateTimelineItem } from '../isDuplicateTimelineItem'

describe('isDuplicateTimelineItem', () => {
  const baseTimelineItem: TimelineItemEntry = {
    id: '1',
    type: 'user',
    content: 'Hello world',
    timestamp: new Date('2024-01-01T10:00:00Z'),
  }

  const existingItems: TimelineItemEntry[] = [baseTimelineItem]

  it('should detect duplicate by ID', () => {
    const newEntry: TimelineItemEntry = {
      id: '1',
      type: 'assistant',
      role: 'db',
      content: 'Different content',
      timestamp: new Date('2024-01-01T11:00:00Z'),
    }

    const result = isDuplicateTimelineItem(existingItems, newEntry)
    expect(result).toBe(true)
  })

  it('should not detect duplicate for different ID', () => {
    const newEntry: TimelineItemEntry = {
      id: '2',
      type: 'assistant',
      role: 'db',
      content: 'Different content',
      timestamp: new Date('2024-01-01T11:00:00Z'),
    }

    const result = isDuplicateTimelineItem(existingItems, newEntry)
    expect(result).toBe(false)
  })

  it('should detect content duplicate for user messages within timestamp tolerance', () => {
    const newEntry: TimelineItemEntry = {
      id: '2',
      type: 'user',
      content: 'Hello world',
      timestamp: new Date('2024-01-01T10:00:03Z'),
    }

    const result = isDuplicateTimelineItem(existingItems, newEntry)
    expect(result).toBe(true)
  })

  it('should not detect content duplicate for user messages outside timestamp tolerance', () => {
    const newEntry: TimelineItemEntry = {
      id: '2',
      type: 'user',
      content: 'Hello world',
      timestamp: new Date('2024-01-01T10:00:06Z'),
    }

    const result = isDuplicateTimelineItem(existingItems, newEntry)
    expect(result).toBe(false)
  })

  it('should not detect content duplicate for different user message content', () => {
    const newEntry: TimelineItemEntry = {
      id: '2',
      type: 'user',
      content: 'Different message',
      timestamp: new Date('2024-01-01T10:00:01Z'),
    }

    const result = isDuplicateTimelineItem(existingItems, newEntry)
    expect(result).toBe(false)
  })

  it('should not detect content duplicate for non-user messages', () => {
    const newEntry: TimelineItemEntry = {
      id: '2',
      type: 'assistant',
      role: 'db',
      content: 'Hello world',
      timestamp: new Date('2024-01-01T10:00:01Z'),
    }

    const result = isDuplicateTimelineItem(existingItems, newEntry)
    expect(result).toBe(false)
  })

  it('should handle empty timeline items array', () => {
    const newEntry: TimelineItemEntry = {
      id: '1',
      type: 'user',
      content: 'Hello world',
      timestamp: new Date(),
    }

    const result = isDuplicateTimelineItem([], newEntry)
    expect(result).toBe(false)
  })

  it('should detect duplicate schema_version by ID', () => {
    const schemaVersionEntry: TimelineItemEntry = {
      id: '1',
      type: 'schema_version',
      content: 'Schema updated',
      buildingSchemaVersionId: 'version-1',
      timestamp: new Date('2024-01-01T10:00:01Z'),
    }

    const duplicateEntry: TimelineItemEntry = {
      id: '1', // Same ID
      type: 'schema_version',
      content: 'Different content',
      buildingSchemaVersionId: 'version-2',
      timestamp: new Date('2024-01-01T11:00:01Z'),
    }

    const result = isDuplicateTimelineItem([schemaVersionEntry], duplicateEntry)
    expect(result).toBe(true)
  })

  it('should not detect duplicate schema_version with different IDs', () => {
    const schemaVersionEntry: TimelineItemEntry = {
      id: '1',
      type: 'schema_version',
      content: 'Schema updated',
      buildingSchemaVersionId: 'version-1',
      timestamp: new Date('2024-01-01T10:00:01Z'),
    }

    const newEntry: TimelineItemEntry = {
      id: '2', // Different ID
      type: 'schema_version',
      content: 'Schema updated',
      buildingSchemaVersionId: 'version-1', // Same version ID but different entry ID
      timestamp: new Date('2024-01-01T10:00:01Z'),
    }

    const result = isDuplicateTimelineItem([schemaVersionEntry], newEntry)
    expect(result).toBe(false)
  })

  it('should handle exact timestamp boundary (5 seconds)', () => {
    const newEntry: TimelineItemEntry = {
      id: '2',
      type: 'user',
      content: 'Hello world',
      timestamp: new Date('2024-01-01T10:00:05Z'),
    }

    const result = isDuplicateTimelineItem(existingItems, newEntry)
    expect(result).toBe(false)
  })

  it('should handle timestamp just within tolerance (4.999 seconds)', () => {
    const newEntry: TimelineItemEntry = {
      id: '2',
      type: 'user',
      content: 'Hello world',
      timestamp: new Date('2024-01-01T10:00:04.999Z'),
    }

    const result = isDuplicateTimelineItem(existingItems, newEntry)
    expect(result).toBe(true)
  })
})
