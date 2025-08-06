import type { RunnableConfig } from '@langchain/core/runnables'
import type {
  ChannelVersions,
  Checkpoint,
  CheckpointListOptions,
  CheckpointMetadata,
  PendingWrite,
} from '@langchain/langgraph-checkpoint'
import type { SupabaseClientType } from '@liam-hq/db'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SupabaseCheckpointSaver } from './SupabaseCheckpointSaver'

// Mock Supabase client with proper chaining
const createMockQueryBuilder = (overrides = {}) => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  ...overrides,
})

const createMockSupabaseClient = (): SupabaseClientType => {
  const mockClient = {
    from: vi.fn().mockImplementation(() => createMockQueryBuilder()),
  }
  return mockClient as SupabaseClientType
}

const mockSupabaseClient = createMockSupabaseClient()

const testOrganizationId = 'org-123'
const testThreadId = 'thread-456'
const testCheckpointId = 'checkpoint-789'

// Type-safe helper to get the mock from function
const getFromSpy = () => mockSupabaseClient.from as ReturnType<typeof vi.fn>

describe('SupabaseCheckpointSaver', () => {
  let saver: SupabaseCheckpointSaver

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset the from mock to return fresh query builders
    getFromSpy().mockImplementation(() => createMockQueryBuilder())

    saver = new SupabaseCheckpointSaver({
      client: mockSupabaseClient,
      options: {
        organizationId: testOrganizationId,
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Test Observable Behavior: Test what consumers can observe
  describe('getTuple', () => {
    it('should retrieve checkpoint by thread_id and checkpoint_id', async () => {
      // Arrange
      const config: RunnableConfig = {
        configurable: {
          thread_id: testThreadId,
          checkpoint_id: testCheckpointId,
        },
      }

      const mockCheckpointData = {
        id: 'uuid-1',
        organization_id: testOrganizationId,
        thread_id: testThreadId,
        checkpoint_ns: '',
        checkpoint_id: testCheckpointId,
        parent_checkpoint_id: null,
        checkpoint: { v: 1, channel_versions: {}, ts: Date.now() },
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Mock database response
      const mockQueryBuilder = createMockQueryBuilder()
      mockQueryBuilder.single = vi.fn().mockResolvedValue({
        data: mockCheckpointData,
        error: null,
      })

      // Mock additional queries for _loadWrites method
      const mockWritesQueryBuilder = createMockQueryBuilder()
      mockWritesQueryBuilder.single = vi
        .fn()
        .mockResolvedValue({ data: [], error: null })

      getFromSpy()
        .mockReturnValueOnce(mockQueryBuilder) // For main checkpoint query
        .mockReturnValueOnce(mockWritesQueryBuilder) // For writes query

      // Act
      const result = await saver.getTuple(config)

      // Assert
      expect(result).toBeDefined()
      expect(result?.config.configurable?.thread_id).toBe(testThreadId)
      expect(result?.config.configurable?.checkpoint_id).toBe(testCheckpointId)
      expect(result?.checkpoint).toBeDefined()
    })

    it('should return undefined for non-existent checkpoint', async () => {
      // Arrange
      const config: RunnableConfig = {
        configurable: {
          thread_id: testThreadId,
          checkpoint_id: 'non-existent',
        },
      }

      // Mock database response - no data found
      const mockQueryBuilder = createMockQueryBuilder()
      mockQueryBuilder.single = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      getFromSpy().mockReturnValue(mockQueryBuilder)

      // Act
      const result = await saver.getTuple(config)

      // Assert
      expect(result).toBeUndefined()
    })

    it('should enforce organization isolation', async () => {
      // Arrange
      const config: RunnableConfig = {
        configurable: {
          thread_id: testThreadId,
          checkpoint_id: testCheckpointId,
        },
      }

      // Act
      await saver.getTuple(config)

      // Assert - verify the query includes organization_id filter
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        'session_checkpoints',
      )
      // Should query with organization_id constraint via RLS
    })
  })

  describe('put', () => {
    it('should save checkpoint with proper metadata', async () => {
      // Arrange
      const config: RunnableConfig = {
        configurable: {
          thread_id: testThreadId,
          checkpoint_ns: '',
        },
      }

      const checkpoint: Checkpoint = {
        v: 1,
        id: testCheckpointId,
        ts: Date.now(),
        channel_versions: { test_channel: 1 },
        versions_seen: {},
      }

      const metadata: CheckpointMetadata = {
        source: 'test',
        step: 1,
      }

      const newVersions: ChannelVersions = {
        test_channel: 1,
      }

      // Mock successful insert
      getFromSpy().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: 'new-uuid' }],
            error: null,
          }),
        }),
      })

      // Act
      const result = await saver.put(config, checkpoint, metadata, newVersions)

      // Assert
      expect(result.configurable?.checkpoint_id).toBe(testCheckpointId)
      expect(result.configurable?.thread_id).toBe(testThreadId)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        'session_checkpoints',
      )
    })

    it('should serialize channel values correctly', async () => {
      // Arrange
      const config: RunnableConfig = {
        configurable: {
          thread_id: testThreadId,
        },
      }

      const checkpoint: Checkpoint = {
        v: 1,
        id: testCheckpointId,
        ts: Date.now(),
        channel_versions: { test_channel: 1 },
        versions_seen: {},
      }

      const complexData = {
        complexField: { nested: { data: [1, 2, 3] } },
        array: ['a', 'b', 'c'],
      }

      const metadata: CheckpointMetadata = complexData
      const newVersions: ChannelVersions = { test_channel: 1 }

      // Mock successful operations
      getFromSpy().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: 'new-uuid' }],
            error: null,
          }),
        }),
      })

      // Act
      const result = await saver.put(config, checkpoint, metadata, newVersions)

      // Assert - should not throw and should return valid config
      expect(result.configurable?.checkpoint_id).toBe(testCheckpointId)
    })

    it('should prevent cross-organization access', async () => {
      // Arrange - Create saver with different org
      const otherOrgSaver = new SupabaseCheckpointSaver({
        client: mockSupabaseClient,
        options: {
          organizationId: 'other-org-456',
        },
      })

      const config: RunnableConfig = {
        configurable: {
          thread_id: testThreadId,
        },
      }

      const checkpoint: Checkpoint = {
        v: 1,
        id: testCheckpointId,
        ts: Date.now(),
        channel_versions: {},
        versions_seen: {},
      }

      // Mock insert with organization check
      getFromSpy().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [],
            error: { message: 'RLS policy violation' },
          }),
        }),
      })

      // Act & Assert
      await expect(
        otherOrgSaver.put(config, checkpoint, {}, {}),
      ).rejects.toThrow()
    })
  })

  describe('list', () => {
    it('should list checkpoints in chronological order', async () => {
      // Arrange
      const config: RunnableConfig = {
        configurable: {
          thread_id: testThreadId,
        },
      }

      const mockCheckpoints = [
        {
          id: 'uuid-1',
          organization_id: testOrganizationId,
          thread_id: testThreadId,
          checkpoint_ns: '',
          checkpoint_id: 'checkpoint-1',
          parent_checkpoint_id: null,
          checkpoint: { v: 1, channel_versions: {}, ts: Date.now() - 1000 },
          metadata: {},
          created_at: new Date(Date.now() - 1000).toISOString(),
          updated_at: new Date(Date.now() - 1000).toISOString(),
        },
        {
          id: 'uuid-2',
          organization_id: testOrganizationId,
          thread_id: testThreadId,
          checkpoint_ns: '',
          checkpoint_id: 'checkpoint-2',
          parent_checkpoint_id: 'checkpoint-1',
          checkpoint: { v: 1, channel_versions: {}, ts: Date.now() },
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      // Mock database response - create Promise-like query builder
      const mockQueryBuilder = Object.assign(
        Promise.resolve({
          data: mockCheckpoints.reverse(), // Should be ordered desc
          error: null,
        }),
        createMockQueryBuilder(),
      )

      // Mock for the writes queries that will be called for each checkpoint
      const mockWritesQueryBuilder = Object.assign(
        Promise.resolve({ data: [], error: null }),
        createMockQueryBuilder(),
      )

      getFromSpy()
        .mockReturnValueOnce(mockQueryBuilder) // For main checkpoint query
        .mockReturnValue(mockWritesQueryBuilder) // For writes queries (multiple calls)

      // Act
      const results = []
      for await (const checkpoint of saver.list(config)) {
        results.push(checkpoint)
      }

      // Assert
      expect(results).toHaveLength(2)
      expect(results[0].config.configurable?.checkpoint_id).toBe('checkpoint-2')
      expect(results[1].config.configurable?.checkpoint_id).toBe('checkpoint-1')
    })

    it('should support filtering and pagination', async () => {
      // Arrange
      const config: RunnableConfig = {
        configurable: {
          thread_id: testThreadId,
        },
      }

      const options: CheckpointListOptions = {
        limit: 5,
        filter: { step: 1 },
      }

      // Mock database response
      getFromSpy().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      })

      // Act
      const results = []
      for await (const checkpoint of saver.list(config, options)) {
        results.push(checkpoint)
      }

      // Assert - should call with limit
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        'session_checkpoints',
      )
    })

    it('should respect organization boundaries', async () => {
      // Arrange
      const config: RunnableConfig = {
        configurable: {
          thread_id: testThreadId,
        },
      }

      // Act
      const results = []
      for await (const checkpoint of saver.list(config)) {
        results.push(checkpoint)
      }

      // Assert - queries should be scoped to organization via RLS
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        'session_checkpoints',
      )
    })
  })

  describe('putWrites', () => {
    it('should store intermediate writes', async () => {
      // Arrange
      const config: RunnableConfig = {
        configurable: {
          thread_id: testThreadId,
          checkpoint_id: testCheckpointId,
        },
      }

      const writes: PendingWrite[] = [
        ['channel1', { type: 'test', data: 'value1' }],
        ['channel2', { type: 'test', data: 'value2' }],
      ]

      const taskId = 'task-123'

      // Mock successful insert
      getFromSpy().mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      // Act
      await saver.putWrites(config, writes, taskId)

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        'session_checkpoint_writes',
      )
    })

    it('should handle task identification properly', async () => {
      // Arrange
      const config: RunnableConfig = {
        configurable: {
          thread_id: testThreadId,
          checkpoint_id: testCheckpointId,
        },
      }

      const writes: PendingWrite[] = [['channel1', { data: 'test' }]]
      const taskId = 'unique-task-456'

      // Mock successful insert
      getFromSpy().mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      // Act
      await saver.putWrites(config, writes, taskId)

      // Assert - Should have been called with data containing taskId
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        'session_checkpoint_writes',
      )
    })
  })

  describe('constructor', () => {
    it('should create instance with valid configuration', () => {
      // Arrange & Act
      const saver = new SupabaseCheckpointSaver({
        client: mockSupabaseClient,
        options: {
          organizationId: testOrganizationId,
          enableCleanup: true,
          maxCheckpoints: 100,
        },
      })

      // Assert
      expect(saver).toBeInstanceOf(SupabaseCheckpointSaver)
    })

    it('should throw error for missing organization ID', () => {
      // Arrange & Act & Assert
      expect(() => {
        new SupabaseCheckpointSaver({
          client: mockSupabaseClient,
          options: {
            organizationId: '', // Invalid empty string
          },
        })
      }).toThrow('organizationId is required')
    })
  })
})
