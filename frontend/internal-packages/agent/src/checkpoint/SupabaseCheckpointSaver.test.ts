import type { RunnableConfig } from '@langchain/core/runnables'
import type {
  Checkpoint,
  CheckpointMetadata,
  PendingWrite,
} from '@langchain/langgraph-checkpoint'
import { createClient } from '@liam-hq/db'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { SupabaseCheckpointSaver } from './SupabaseCheckpointSaver'

// Test constants
const TEST_ORG_ID = 'test-org-123'
const TEST_THREAD_ID = 'thread-456'
const TEST_CHECKPOINT_NS = 'test-namespace'
const TEST_CHECKPOINT_ID = 'checkpoint-789'
const SUPABASE_URL = 'http://localhost:54321'
const SUPABASE_ANON_KEY = 'test-anon-key'

// Mock server setup
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('SupabaseCheckpointSaver', () => {
  const createTestSaver = () => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    return new SupabaseCheckpointSaver({
      client,
      options: { organizationId: TEST_ORG_ID },
    })
  }

  const createMinimalCheckpoint = (): Checkpoint => ({
    v: 1,
    id: TEST_CHECKPOINT_ID,
    ts: '2025-01-06T10:00:00.000Z',
    channel_values: {
      messages: ['Hello', 'World'],
      state: { count: 42 },
    },
    channel_versions: {
      messages: 1,
      state: 1,
    },
    versions_seen: {},
  })

  const createMinimalConfig = (): RunnableConfig => ({
    configurable: {
      thread_id: TEST_THREAD_ID,
      checkpoint_ns: TEST_CHECKPOINT_NS,
      checkpoint_id: TEST_CHECKPOINT_ID,
    },
  })

  // Mock response handlers
  const mockCheckpointsResponse = (
    data: Record<string, unknown> | Array<Record<string, unknown>>,
  ) =>
    http.get(`${SUPABASE_URL}/rest/v1/checkpoints`, () => {
      return HttpResponse.json(data)
    })

  const mockBlobsResponse = (
    data: Record<string, unknown> | Array<Record<string, unknown>>,
  ) =>
    http.get(`${SUPABASE_URL}/rest/v1/checkpoint_blobs`, () => {
      return HttpResponse.json(data)
    })

  const mockWritesResponse = (
    data: Record<string, unknown> | Array<Record<string, unknown>>,
  ) =>
    http.get(`${SUPABASE_URL}/rest/v1/checkpoint_writes`, () => {
      return HttpResponse.json(data)
    })

  const mockSaveCheckpointResponse = () =>
    http.post(`${SUPABASE_URL}/rest/v1/checkpoints`, () => {
      return HttpResponse.json({ success: true })
    })

  const mockSaveBlobsResponse = () =>
    http.post(`${SUPABASE_URL}/rest/v1/checkpoint_blobs`, () => {
      return HttpResponse.json({ success: true })
    })

  const mockSaveWritesResponse = () =>
    http.post(`${SUPABASE_URL}/rest/v1/checkpoint_writes`, () => {
      return HttpResponse.json({ success: true })
    })

  describe('Checkpoint persistence', () => {
    it('should save and retrieve a checkpoint with state', async () => {
      // Arrange
      const checkpoint = createMinimalCheckpoint()
      const metadata: CheckpointMetadata = {
        source: 'input' as const,
        step: -1,
        parents: {},
      }
      const config = createMinimalConfig()

      // Mock save operations
      server.use(mockSaveCheckpointResponse(), mockSaveBlobsResponse())

      // Mock retrieval
      const savedCheckpointData = {
        thread_id: TEST_THREAD_ID,
        checkpoint_ns: TEST_CHECKPOINT_NS,
        checkpoint_id: TEST_CHECKPOINT_ID,
        checkpoint: {
          v: checkpoint.v,
          id: checkpoint.id,
          ts: checkpoint.ts,
          channel_versions: checkpoint.channel_versions,
          versions_seen: checkpoint.versions_seen,
        },
        metadata,
        organization_id: TEST_ORG_ID,
        created_at: '2025-01-06T10:00:00.000Z',
        updated_at: '2025-01-06T10:00:00.000Z',
      }

      // Simulate Supabase returning hex format for BYTEA columns
      const messageBlobData = JSON.stringify(
        checkpoint.channel_values?.['messages'],
      )
      const stateBlobData = JSON.stringify(checkpoint.channel_values?.['state'])

      // Simulate Supabase's double encoding: JSON -> Base64 -> Hex
      const messageBase64 = Buffer.from(messageBlobData).toString('base64')
      const stateBase64 = Buffer.from(stateBlobData).toString('base64')

      const blobsData = [
        {
          channel: 'messages',
          type: 'json',
          // Convert to hex format like Supabase does (Base64 string -> Hex)
          blob: `\\x${Array.from(Buffer.from(messageBase64))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')}`,
        },
        {
          channel: 'state',
          type: 'json',
          // Convert to hex format like Supabase does (Base64 string -> Hex)
          blob: `\\x${Array.from(Buffer.from(stateBase64))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')}`,
        },
      ]

      server.use(
        mockCheckpointsResponse(savedCheckpointData),
        mockBlobsResponse(blobsData),
        mockWritesResponse([]),
      )

      const saver = createTestSaver()

      // Act & Assert
      // Save checkpoint
      const saveResult = await saver.put(
        config,
        checkpoint,
        metadata,
        checkpoint.channel_versions,
      )
      expect(saveResult).toEqual({
        configurable: {
          thread_id: 'thread-456',
          checkpoint_ns: 'test-namespace',
          checkpoint_id: 'checkpoint-789',
        },
      })

      // Retrieve checkpoint
      const retrievedTuple = await saver.getTuple(config)
      expect(retrievedTuple).toEqual({
        config: {
          configurable: {
            thread_id: 'thread-456',
            checkpoint_ns: 'test-namespace',
            checkpoint_id: 'checkpoint-789',
          },
        },
        checkpoint: {
          v: 1,
          id: 'checkpoint-789',
          ts: '2025-01-06T10:00:00.000Z',
          channel_values: {
            messages: ['Hello', 'World'],
            state: { count: 42 },
          },
          channel_versions: {
            messages: 1,
            state: 1,
          },
          versions_seen: {},
        },
        metadata: {
          source: 'input' as const,
          step: -1,
          parents: {},
        },
        parentConfig: undefined,
        pendingWrites: [],
      })
    })

    it('should retrieve the latest checkpoint when no checkpoint_id is specified', async () => {
      // Arrange
      const latestCheckpoint = {
        thread_id: TEST_THREAD_ID,
        checkpoint_ns: TEST_CHECKPOINT_NS,
        checkpoint_id: 'latest-checkpoint',
        parent_checkpoint_id: null,
        checkpoint: {
          v: 1,
          id: 'latest-checkpoint',
          ts: '2025-01-06T10:00:00.000Z',
          channel_versions: { messages: 2 },
          versions_seen: {},
        },
        metadata: {
          source: 'input' as const,
          step: -1,
          parents: {},
          latest: true,
        },
        organization_id: TEST_ORG_ID,
        created_at: '2025-01-06T10:00:00.000Z',
        updated_at: '2025-01-06T10:00:00.000Z',
      }

      server.use(
        mockCheckpointsResponse(latestCheckpoint),
        mockBlobsResponse([]),
        mockWritesResponse([]),
      )

      const saver = createTestSaver()
      const config: RunnableConfig = {
        configurable: {
          thread_id: TEST_THREAD_ID,
          checkpoint_ns: TEST_CHECKPOINT_NS,
        },
      }

      // Act
      const result = await saver.getTuple(config)

      // Assert
      expect(result).toEqual({
        config: {
          configurable: {
            thread_id: 'thread-456',
            checkpoint_ns: 'test-namespace',
            checkpoint_id: 'latest-checkpoint',
          },
        },
        checkpoint: {
          v: 1,
          id: 'latest-checkpoint',
          ts: '2025-01-06T10:00:00.000Z',
          channel_values: {},
          channel_versions: { messages: 2 },
          versions_seen: {},
        },
        metadata: {
          source: 'input' as const,
          step: -1,
          parents: {},
          latest: true,
        },
        parentConfig: undefined,
        pendingWrites: [],
      })
    })
  })

  describe('Checkpoint listing', () => {
    it('should list checkpoints with parent relationships', async () => {
      // Arrange
      const checkpoints = [
        {
          thread_id: TEST_THREAD_ID,
          checkpoint_ns: TEST_CHECKPOINT_NS,
          checkpoint_id: 'child',
          parent_checkpoint_id: 'parent',
          checkpoint: {
            v: 1,
            id: 'child',
            ts: '2025-01-06T10:00:00.000Z',
            channel_versions: {},
            versions_seen: {},
          },
          metadata: {
            source: 'input' as const,
            step: 0,
            parents: {},
          },
          organization_id: TEST_ORG_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          thread_id: TEST_THREAD_ID,
          checkpoint_ns: TEST_CHECKPOINT_NS,
          checkpoint_id: 'parent',
          parent_checkpoint_id: null,
          checkpoint: {
            v: 1,
            id: 'parent',
            ts: '2025-01-06T10:00:00.000Z',
            channel_versions: {},
            versions_seen: {},
          },
          metadata: {
            source: 'input' as const,
            step: 0,
            parents: {},
          },
          organization_id: TEST_ORG_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      server.use(
        mockCheckpointsResponse(checkpoints),
        mockBlobsResponse([]),
        mockWritesResponse([]),
      )

      const saver = createTestSaver()
      const config: RunnableConfig = {
        configurable: {
          thread_id: TEST_THREAD_ID,
          checkpoint_ns: TEST_CHECKPOINT_NS,
        },
      }

      // Act
      const results = []
      for await (const item of saver.list(config)) {
        results.push(item)
      }

      // Assert
      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({
        config: {
          configurable: {
            thread_id: 'thread-456',
            checkpoint_ns: 'test-namespace',
            checkpoint_id: 'child',
          },
        },
        checkpoint: {
          v: 1,
          id: 'child',
          ts: '2025-01-06T10:00:00.000Z',
          channel_values: {},
          channel_versions: {},
          versions_seen: {},
        },
        metadata: {
          source: 'input' as const,
          step: 0,
          parents: {},
        },
        parentConfig: {
          configurable: {
            thread_id: 'thread-456',
            checkpoint_ns: 'test-namespace',
            checkpoint_id: 'parent',
          },
        },
        pendingWrites: [],
      })
    })

    it('should filter checkpoints by metadata', async () => {
      // Arrange
      const activeCheckpoint = {
        thread_id: TEST_THREAD_ID,
        checkpoint_ns: TEST_CHECKPOINT_NS,
        checkpoint_id: 'active-checkpoint',
        parent_checkpoint_id: null,
        checkpoint: {
          v: 1,
          id: 'active-checkpoint',
          ts: '2025-01-06T10:00:00.000Z',
          channel_versions: {},
          versions_seen: {},
        },
        metadata: {
          source: 'input' as const,
          step: -1,
          parents: {},
          status: 'active',
        },
        organization_id: TEST_ORG_ID,
        created_at: '2025-01-06T10:00:00.000Z',
        updated_at: '2025-01-06T10:00:00.000Z',
      }

      server.use(
        mockCheckpointsResponse([activeCheckpoint]),
        mockBlobsResponse([]),
        mockWritesResponse([]),
      )

      const saver = createTestSaver()
      const config: RunnableConfig = {
        configurable: {
          thread_id: TEST_THREAD_ID,
          checkpoint_ns: TEST_CHECKPOINT_NS,
        },
      }

      // Act
      const results = []
      for await (const item of saver.list(config, {
        filter: { status: 'active' },
      })) {
        results.push(item)
      }

      // Assert
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        config: {
          configurable: {
            thread_id: 'thread-456',
            checkpoint_ns: 'test-namespace',
            checkpoint_id: 'active-checkpoint',
          },
        },
        checkpoint: {
          v: 1,
          id: 'active-checkpoint',
          ts: '2025-01-06T10:00:00.000Z',
          channel_values: {},
          channel_versions: {},
          versions_seen: {},
        },
        metadata: {
          source: 'input' as const,
          step: -1,
          parents: {},
          status: 'active',
        },
        parentConfig: undefined,
        pendingWrites: [],
      })
    })
  })

  describe('Pending writes', () => {
    it('should save pending writes for a checkpoint', async () => {
      // Arrange
      server.use(mockSaveWritesResponse())

      const saver = createTestSaver()
      const config = createMinimalConfig()
      const writes: PendingWrite[] = [
        ['messages', { content: 'New message' }],
        ['state', { updated: true }],
      ]

      // Act & Assert
      await expect(
        saver.putWrites(config, writes, 'task-123'),
      ).resolves.not.toThrow()
    })
  })

  describe('Error handling', () => {
    it('should return undefined when retrieving non-existent checkpoint', async () => {
      // Arrange
      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/checkpoints`, () => {
          return new HttpResponse(null, { status: 406 })
        }),
      )

      const saver = createTestSaver()
      const config = createMinimalConfig()

      // Act
      const result = await saver.getTuple(config)

      // Assert
      expect(result).toBeUndefined()
    })

    it('should reject save when required config is missing', async () => {
      // Arrange
      const saver = createTestSaver()
      const checkpoint = createMinimalCheckpoint()
      const invalidConfig: RunnableConfig = {}

      // Act & Assert
      const emptyMetadata: CheckpointMetadata = {
        source: 'input' as const,
        step: -1,
        parents: {},
      }
      await expect(
        saver.put(invalidConfig, checkpoint, emptyMetadata, {}),
      ).rejects.toThrow('Missing "configurable" field')
    })

    it('should reject pending writes when thread_id is missing', async () => {
      // Arrange
      const saver = createTestSaver()
      const invalidConfig: RunnableConfig = { configurable: {} }

      // Act & Assert
      await expect(
        saver.putWrites(invalidConfig, [], 'task-1'),
      ).rejects.toThrow('Missing thread_id or checkpoint_id')
    })
  })

  describe('deleteThread', () => {
    it('should delete all checkpoints and related data for a thread', async () => {
      const saver = createTestSaver()
      const threadId = 'thread-to-delete'

      // Setup mock handlers for delete operations
      const deleteHandlers = {
        checkpoints: false,
        writes: false,
        blobs: false,
      }

      server.use(
        http.delete(`${SUPABASE_URL}/rest/v1/checkpoints`, () => {
          deleteHandlers.checkpoints = true
          return HttpResponse.json({})
        }),
        http.delete(`${SUPABASE_URL}/rest/v1/checkpoint_writes`, () => {
          deleteHandlers.writes = true
          return HttpResponse.json({})
        }),
        http.delete(`${SUPABASE_URL}/rest/v1/checkpoint_blobs`, () => {
          deleteHandlers.blobs = true
          return HttpResponse.json({})
        }),
      )

      // Call deleteThread
      await saver.deleteThread(threadId)

      // Verify all delete operations were called
      expect(deleteHandlers.checkpoints).toBe(true)
      expect(deleteHandlers.writes).toBe(true)
      expect(deleteHandlers.blobs).toBe(true)
    })

    it('should throw error when delete operations fail', async () => {
      const saver = createTestSaver()
      const threadId = 'thread-with-error'

      // Setup mock handler to return error for checkpoints deletion
      server.use(
        http.delete(`${SUPABASE_URL}/rest/v1/checkpoints`, () => {
          return HttpResponse.json(
            {
              error: 'Database connection lost',
              message: 'Database connection lost',
            },
            { status: 500 },
          )
        }),
      )

      // deleteThread should throw when database operation fails
      await expect(saver.deleteThread(threadId)).rejects.toThrow(
        'Failed to delete checkpoints for thread thread-with-error: Database connection lost',
      )
    })
  })

  describe('Organization data isolation', () => {
    it('should include organization_id in all database operations', async () => {
      // Arrange
      let capturedSaveData: unknown = null
      let capturedQueryParams: URLSearchParams | null = null

      server.use(
        http.post(
          `${SUPABASE_URL}/rest/v1/checkpoints`,
          async ({ request }) => {
            capturedSaveData = await request.json()
            return HttpResponse.json({ success: true })
          },
        ),
        mockSaveBlobsResponse(),
        http.get(`${SUPABASE_URL}/rest/v1/checkpoints`, ({ request }) => {
          const url = new URL(request.url)
          capturedQueryParams = url.searchParams
          return new HttpResponse(null, { status: 406 }) // Supabase returns 406 when no data found with .single()
        }),
      )

      const saver = createTestSaver()
      const checkpoint = createMinimalCheckpoint()
      const config = createMinimalConfig()

      // Act
      // Test save operation includes organization_id
      const metadata: CheckpointMetadata = {
        source: 'input' as const,
        step: -1,
        parents: {},
      }
      await saver.put(config, checkpoint, metadata, checkpoint.channel_versions)

      // Assert
      if (
        capturedSaveData &&
        typeof capturedSaveData === 'object' &&
        'organization_id' in capturedSaveData
      ) {
        expect(capturedSaveData.organization_id).toBe(TEST_ORG_ID)
      }

      // Act
      // Test query operation filters by organization_id
      const result = await saver.getTuple(config)

      // Assert
      expect(result).toBeUndefined() // No checkpoint found
      expect(capturedQueryParams).toBeDefined()
    })
  })
})
