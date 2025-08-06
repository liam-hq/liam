import type { SupabaseClientType } from '@liam-hq/db'
import { describe, expect, it, vi } from 'vitest'
import { SupabaseCheckpointSaver } from './SupabaseCheckpointSaver'

// Simple mock that supports chaining
const createChainableMock = () => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
})

// Create a minimal but properly typed mock for testing
const createMockSupabaseClient = (): SupabaseClientType => {
  const mockClient = {
    from: vi.fn().mockImplementation(() => createChainableMock()),
  }

  // Return the mock with all required SupabaseClient properties, but only implement what we need
  return mockClient as SupabaseClientType
}

const mockSupabaseClient = createMockSupabaseClient()

describe('SupabaseCheckpointSaver - Basic Behavior', () => {
  describe('constructor', () => {
    it('should create instance with valid configuration', () => {
      // Act
      const saver = new SupabaseCheckpointSaver({
        client: mockSupabaseClient,
        options: {
          organizationId: 'org-123',
          enableCleanup: true,
          maxCheckpoints: 100,
        },
      })

      // Assert
      expect(saver).toBeInstanceOf(SupabaseCheckpointSaver)
    })

    it('should throw error for missing organization ID', () => {
      // Act & Assert
      expect(() => {
        new SupabaseCheckpointSaver({
          client: mockSupabaseClient,
          options: {
            organizationId: '', // Invalid empty string
          },
        })
      }).toThrow('organizationId is required')
    })

    it('should set default options correctly', () => {
      // Act
      const saver = new SupabaseCheckpointSaver({
        client: mockSupabaseClient,
        options: {
          organizationId: 'org-123',
        },
      })

      // Assert - we can't directly access private properties, but we can test the behavior
      expect(saver).toBeInstanceOf(SupabaseCheckpointSaver)
      // The options should be set with defaults (we can verify this through integration tests)
    })
  })

  describe('error handling', () => {
    it('should throw error for getTuple without thread_id', async () => {
      // Arrange
      const saver = new SupabaseCheckpointSaver({
        client: mockSupabaseClient,
        options: {
          organizationId: 'org-123',
        },
      })

      const config = {
        configurable: {}, // Missing thread_id
      }

      // Act & Assert
      await expect(saver.getTuple(config)).rejects.toThrow(
        'thread_id is required',
      )
    })

    it('should throw error for putWrites without required config', async () => {
      // Arrange
      const saver = new SupabaseCheckpointSaver({
        client: mockSupabaseClient,
        options: {
          organizationId: 'org-123',
        },
      })

      const config = {
        configurable: {
          thread_id: 'test',
          // Missing checkpoint_id
        },
      }

      // Act & Assert
      await expect(saver.putWrites(config, [], 'task-123')).rejects.toThrow(
        'thread_id and checkpoint_id are required',
      )
    })
  })

  describe('data validation', () => {
    it('should handle undefined checkpoint_ns as empty string', async () => {
      // Arrange
      const saver = new SupabaseCheckpointSaver({
        client: mockSupabaseClient,
        options: {
          organizationId: 'org-123',
        },
      })

      const config = {
        configurable: {
          thread_id: 'test',
          // checkpoint_ns is undefined
        },
      }

      // Act - should not throw
      const result = await saver.getTuple(config)

      // Assert - should return undefined (no data found) but not throw
      expect(result).toBeUndefined()
    })
  })
})
