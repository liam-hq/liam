import { describe, expect, it, vi } from 'vitest'
import type { WorkflowState } from '../types'
import { executeDdlNode } from './executeDdlNode'

vi.mock('@liam-hq/pglite-server', () => ({
  executeQuery: vi.fn(),
}))

describe('executeDdlNode retry behavior', () => {
  const createMockState = (overrides?: Partial<WorkflowState>): WorkflowState =>
    ({
      userInput: '',
      formattedHistory: '',
      schemaData: { tables: {} },
      buildingSchemaId: 'test-id',
      latestVersionNumber: 1,
      repositories: {
        schema: {
          updateTimelineItem: vi.fn(),
        },
      } as any,
      designSessionId: 'session-id',
      userId: 'user-id',
      logger: {
        log: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
      },
      retryCount: {},
      ddlStatements: 'CREATE TABLE users (id INT PRIMARY KEY);',
      ...overrides,
    }) as WorkflowState

  it('should set shouldRetryWithDesignSchema on first DDL execution failure', async () => {
    const { executeQuery } = await import('@liam-hq/pglite-server')
    vi.mocked(executeQuery).mockResolvedValue([
      {
        success: false,
        sql: 'CREATE TABLE users (id INT PRIMARY KEY);',
        result: { error: 'Foreign key constraint violation' },
        id: '1',
        metadata: { executionTime: 0, timestamp: new Date().toISOString() },
      },
    ])

    const state = createMockState()
    const result = await executeDdlNode(state)

    expect(result.shouldRetryWithDesignSchema).toBe(true)
    expect(result.ddlExecutionFailureReason).toContain(
      'Foreign key constraint violation',
    )
    expect(result.retryCount['ddlExecutionRetry']).toBe(1)
    expect(result.ddlExecutionFailed).toBeUndefined()
  })

  it('should mark as permanently failed on second DDL execution failure', async () => {
    const { executeQuery } = await import('@liam-hq/pglite-server')
    vi.mocked(executeQuery).mockResolvedValue([
      {
        success: false,
        sql: 'CREATE TABLE users (id INT PRIMARY KEY);',
        result: { error: 'Foreign key constraint violation' },
        id: '1',
        metadata: { executionTime: 0, timestamp: new Date().toISOString() },
      },
    ])

    const state = createMockState({
      retryCount: { ddlExecutionRetry: 1 },
    })
    const result = await executeDdlNode(state)

    expect(result.ddlExecutionFailed).toBe(true)
    expect(result.ddlExecutionFailureReason).toContain(
      'Foreign key constraint violation',
    )
    expect(result.shouldRetryWithDesignSchema).toBeUndefined()
  })

  it('should handle successful DDL execution', async () => {
    const { executeQuery } = await import('@liam-hq/pglite-server')
    vi.mocked(executeQuery).mockResolvedValue([
      {
        success: true,
        sql: 'CREATE TABLE users (id INT PRIMARY KEY);',
        result: {},
        id: '1',
        metadata: { executionTime: 0, timestamp: new Date().toISOString() },
      },
    ])

    const state = createMockState()
    const result = await executeDdlNode(state)

    expect(result.shouldRetryWithDesignSchema).toBeUndefined()
    expect(result.ddlExecutionFailed).toBeUndefined()
    expect(result.ddlExecutionFailureReason).toBeUndefined()
  })
})
