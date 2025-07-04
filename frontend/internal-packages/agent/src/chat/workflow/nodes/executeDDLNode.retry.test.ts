import { aColumn, aTable } from '@liam-hq/db-structure'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkflowState } from '../types'
import { executeDDLNode } from './executeDDLNode'

// Mock executeQuery
vi.mock('@liam-hq/pglite-server', () => ({
  executeQuery: vi.fn(),
}))

describe('executeDDLNode retry mechanism', () => {
  const mockLogger = {
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }

  const createMockState = (
    ddlStatements: string,
    retryCount: Record<string, number> = {},
  ): WorkflowState => ({
    userInput: 'Add todos table with foreign key to users',
    schemaData: {
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
          },
          constraints: {}, // Missing PRIMARY KEY constraint
        }),
        todos: aTable({
          name: 'todos',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
            user_id: aColumn({ name: 'user_id', type: 'uuid', notNull: true }),
          },
        }),
      },
    },
    logger: mockLogger,
    onNodeProgress: undefined,
    formattedHistory: '',
    retryCount,
    buildingSchemaId: 'test-schema',
    latestVersionNumber: 1,
    userId: 'test-user',
    designSessionId: 'test-session',
    repositories: {} as never,
    ddlStatements,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return failure indicator when DDL execution fails and not retry if already retried', async () => {
    // RED: This test will fail because executeDDLNode doesn't return failure indicators yet
    const { executeQuery } = await import('@liam-hq/pglite-server')

    // Mock DDL execution failure (foreign key constraint error)
    const failedResults: SqlResult[] = [
      {
        id: '1',
        success: true,
        sql: 'CREATE TABLE "users" ...',
        result: {},
        metadata: { executionTime: 100, timestamp: '2024-01-01T00:00:00Z' },
      },
      {
        id: '2',
        success: false,
        sql: 'ALTER TABLE "todos" ADD CONSTRAINT "todos_user_fk" FOREIGN KEY ...',
        result: {
          error:
            'there is no unique constraint matching given keys for referenced table "users"',
        },
        metadata: { executionTime: 100, timestamp: '2024-01-01T00:00:00Z' },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(failedResults)

    // State indicates this DDL execution has already been retried once
    const state = createMockState(
      'CREATE TABLE "users" ...; ALTER TABLE "todos" ADD CONSTRAINT ...',
      { ddlExecutionRetry: 1 }, // Already retried once
    )

    const result = await executeDDLNode(state)

    // Should NOT retry again and should return failure indicator
    expect(result.ddlExecutionFailed).toBe(true)
    expect(result.retryCount['ddlExecutionRetry']).toBe(1) // Should not increment
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('[executeDDLNode] DDL execution failed'),
    )
  })

  it('should return retry indicator when DDL execution fails for the first time', async () => {
    // RED: This test will fail because executeDDLNode doesn't return retry indicators yet
    const { executeQuery } = await import('@liam-hq/pglite-server')

    const failedResults: SqlResult[] = [
      {
        id: '1',
        success: false,
        sql: 'ALTER TABLE "todos" ADD CONSTRAINT ...',
        result: {
          error:
            'there is no unique constraint matching given keys for referenced table "users"',
        },
        metadata: { executionTime: 100, timestamp: '2024-01-01T00:00:00Z' },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(failedResults)

    // State indicates this is the first DDL execution attempt
    const state = createMockState(
      'ALTER TABLE "todos" ADD CONSTRAINT ...',
      {}, // No retries yet
    )

    const result = await executeDDLNode(state)

    // Should indicate retry is needed
    expect(result.shouldRetryWithDesignSchema).toBe(true)
    expect(result.retryCount['ddlExecutionRetry']).toBe(1)
    expect(result.ddlExecutionFailureReason).toContain(
      'there is no unique constraint matching given keys',
    )
  })

  it('should succeed normally when DDL execution is successful', async () => {
    const { executeQuery } = await import('@liam-hq/pglite-server')

    const successResults: SqlResult[] = [
      {
        id: '1',
        success: true,
        sql: 'CREATE TABLE "users" ...',
        result: {},
        metadata: { executionTime: 100, timestamp: '2024-01-01T00:00:00Z' },
      },
      {
        id: '2',
        success: true,
        sql: 'ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id")',
        result: {},
        metadata: { executionTime: 100, timestamp: '2024-01-01T00:00:00Z' },
      },
      {
        id: '3',
        success: true,
        sql: 'ALTER TABLE "todos" ADD CONSTRAINT "todos_user_fk" FOREIGN KEY ...',
        result: {},
        metadata: { executionTime: 100, timestamp: '2024-01-01T00:00:00Z' },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(successResults)

    const state = createMockState('CREATE TABLE "users" ...; ALTER TABLE ...')

    const result = await executeDDLNode(state)

    // Should succeed without retry indicators
    expect(result.shouldRetryWithDesignSchema).toBeUndefined()
    expect(result.ddlExecutionFailed).toBeUndefined()
    expect(result.ddlExecutionFailureReason).toBeUndefined()
    expect(mockLogger.log).toHaveBeenCalledWith(
      '[executeDDLNode] DDL executed successfully',
    )
  })
})
