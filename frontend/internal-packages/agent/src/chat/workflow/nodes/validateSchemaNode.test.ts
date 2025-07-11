import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repositories } from '../../../repositories'
import type { WorkflowState } from '../types'
import { validateSchemaNode } from './validateSchemaNode'

vi.mock('@liam-hq/pglite-server', () => ({
  executeQuery: vi.fn(),
}))

describe('validateSchemaNode', () => {
  const mockLogger = {
    debug: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }

  const createMockState = (
    overrides?: Partial<WorkflowState>,
  ): WorkflowState => {
    return {
      messages: [],
      userInput: 'test',
      schemaData: { tables: {} },
      buildingSchemaId: 'test-id',
      latestVersionNumber: 1,
      userId: 'user-id',
      designSessionId: 'session-id',
      retryCount: {},
      ...overrides,
    }
  }

  const createMockRepositories = (): Repositories => {
    return {
      schema: {
        updateTimelineItem: vi.fn(),
        getSchema: vi.fn(),
        getDesignSession: vi.fn(),
        createVersion: vi.fn(),
        createTimelineItem: vi.fn(),
        createArtifact: vi.fn(),
        updateArtifact: vi.fn(),
        getArtifact: vi.fn(),
      },
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle empty statements', async () => {
    const state = createMockState({
      dmlStatements: '',
      ddlStatements: '',
    })

    const repositories = createMockRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(executeQuery).not.toHaveBeenCalled()
    expect(result).toEqual(state)
  })

  it('should execute only DML when DDL is empty', async () => {
    const mockResults: SqlResult[] = [
      {
        success: true,
        sql: 'INSERT INTO users VALUES (1, "test");',
        result: { rows: [], columns: [] },
        id: 'result-1',
        metadata: {
          executionTime: 5,
          timestamp: new Date().toISOString(),
        },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(mockResults)

    const state = createMockState({
      dmlStatements: 'INSERT INTO users VALUES (1, "test");',
      ddlStatements: '',
    })

    const repositories = createMockRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(executeQuery).toHaveBeenCalledWith(
      'session-id',
      'INSERT INTO users VALUES (1, "test");',
    )
    expect(result.dmlExecutionSuccessful).toBe(true)
  })

  it('should execute only DDL when DML is empty', async () => {
    const mockResults: SqlResult[] = [
      {
        success: true,
        sql: 'CREATE TABLE users (id INT);',
        result: { rows: [], columns: [] },
        id: 'result-1',
        metadata: {
          executionTime: 10,
          timestamp: new Date().toISOString(),
        },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(mockResults)

    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
      dmlStatements: '',
    })

    const repositories = createMockRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(executeQuery).toHaveBeenCalledWith(
      'session-id',
      'CREATE TABLE users (id INT);',
    )
    expect(result.dmlExecutionSuccessful).toBe(true)
  })

  it('should combine and execute DDL and DML together', async () => {
    const mockResults: SqlResult[] = [
      {
        success: true,
        sql: 'CREATE TABLE users (id INT);',
        result: { rows: [], columns: [] },
        id: 'result-1',
        metadata: {
          executionTime: 10,
          timestamp: new Date().toISOString(),
        },
      },
      {
        success: true,
        sql: 'INSERT INTO users VALUES (1);',
        result: { rows: [], columns: [] },
        id: 'result-2',
        metadata: {
          executionTime: 5,
          timestamp: new Date().toISOString(),
        },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(mockResults)

    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
      dmlStatements: 'INSERT INTO users VALUES (1);',
    })

    const repositories = createMockRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(executeQuery).toHaveBeenCalledWith(
      'session-id',
      'CREATE TABLE users (id INT);\nINSERT INTO users VALUES (1);',
    )
    expect(result.dmlExecutionSuccessful).toBe(true)
  })

  it('should handle execution errors', async () => {
    const mockResults: SqlResult[] = [
      {
        success: true,
        sql: 'CREATE TABLE users (id INT);',
        result: { rows: [], columns: [] },
        id: 'result-1',
        metadata: {
          executionTime: 10,
          timestamp: new Date().toISOString(),
        },
      },
      {
        success: false,
        sql: 'INSERT INTO invalid_table VALUES (1);',
        result: { error: 'Table not found' },
        id: 'result-2',
        metadata: {
          executionTime: 2,
          timestamp: new Date().toISOString(),
        },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(mockResults)

    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
      dmlStatements: 'INSERT INTO invalid_table VALUES (1);',
    })

    const repositories = createMockRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(result.dmlExecutionSuccessful).toBeUndefined()
    expect(result.dmlExecutionErrors).toContain('Table not found')
  })

  it('should trim whitespace from statements', async () => {
    const state = createMockState({
      ddlStatements: '   ',
      dmlStatements: '   ',
    })

    const repositories = createMockRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(executeQuery).not.toHaveBeenCalled()
    expect(result).toEqual(state)
  })

  it('should handle missing DML statements', async () => {
    const state = createMockState({
      dmlStatements: undefined,
    })

    const repositories = createMockRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(executeQuery).not.toHaveBeenCalled()
    expect(result).toEqual(state)
  })

  it('should retry execution on retryable errors', async () => {
    const mockResults: SqlResult[] = [
      {
        success: false,
        sql: 'INSERT INTO users VALUES (1);',
        result: { error: 'foreign key constraint violation' },
        id: 'result-1',
        metadata: {
          executionTime: 5,
          timestamp: new Date().toISOString(),
        },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(mockResults)

    const state = createMockState({
      dmlStatements: 'INSERT INTO users VALUES (1);',
    })

    const repositories = createMockRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(result.shouldRetryDmlExecution).toBe(true)
    expect(result.dmlRetryReason).toContain('foreign key constraint violation')
    expect(result.retryCount['dmlExecutionRetry']).toBe(1)
    expect(mockLogger.log).toHaveBeenCalledWith(
      '[validateSchemaNode] Execution failed with retryable error, scheduling retry',
    )
  })

  it('should not retry execution on non-retryable errors', async () => {
    const mockResults: SqlResult[] = [
      {
        success: false,
        sql: 'INSERT INTO users VALUES;',
        result: { error: 'syntax error at or near "VALUES"' },
        id: 'result-1',
        metadata: {
          executionTime: 2,
          timestamp: new Date().toISOString(),
        },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(mockResults)

    const state = createMockState({
      dmlStatements: 'INSERT INTO users VALUES;',
    })

    const repositories = createMockRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(result.shouldRetryDmlExecution).toBeUndefined()
    expect(result.dmlExecutionErrors).toContain('syntax error')
    expect(mockLogger.log).toHaveBeenCalledWith(
      '[validateSchemaNode] Completed with errors',
    )
  })

  it('should not retry after max retries exceeded', async () => {
    const mockResults: SqlResult[] = [
      {
        success: false,
        sql: 'INSERT INTO users VALUES (1);',
        result: { error: 'foreign key constraint violation' },
        id: 'result-1',
        metadata: {
          executionTime: 5,
          timestamp: new Date().toISOString(),
        },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(mockResults)

    const state = createMockState({
      dmlStatements: 'INSERT INTO users VALUES (1);',
      retryCount: { dmlExecutionRetry: 1 }, // Already at max retries
    })

    const repositories = createMockRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(result.shouldRetryDmlExecution).toBeUndefined()
    expect(result.dmlExecutionErrors).toContain(
      'foreign key constraint violation',
    )
    expect(result.retryCount['dmlExecutionRetry']).toBe(1)
  })

  it('should handle mixed success and failure in execution', async () => {
    const mockResults: SqlResult[] = [
      {
        success: true,
        sql: 'INSERT INTO categories VALUES (1, "test");',
        result: { rows: [], columns: [] },
        id: 'result-1',
        metadata: {
          executionTime: 5,
          timestamp: new Date().toISOString(),
          affectedRows: 1,
        },
      },
      {
        success: false,
        sql: 'INSERT INTO products VALUES (1, 999);',
        result: { error: 'foreign key constraint violation on category_id' },
        id: 'result-2',
        metadata: {
          executionTime: 3,
          timestamp: new Date().toISOString(),
        },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(mockResults)

    const state = createMockState({
      dmlStatements:
        'INSERT INTO categories VALUES (1, "test"); INSERT INTO products VALUES (1, 999);',
    })

    const repositories = createMockRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(result.shouldRetryDmlExecution).toBe(true)
    expect(result.dmlRetryReason).toContain('foreign key constraint violation')
  })
})
