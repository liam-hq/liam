import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repositories } from '../../../repositories'
import { InMemoryRepository } from '../../../repositories/InMemoryRepository'
import type { WorkflowState } from '../types'
import { validateSchemaNode } from './validateSchemaNode'

vi.mock('@liam-hq/pglite-server', () => ({
  executeQuery: vi.fn(),
}))

describe('validateSchemaNode', () => {
  const createMockState = (
    overrides?: Partial<WorkflowState>,
  ): WorkflowState => {
    return {
      messages: [],
      userInput: 'test',
      schemaData: { tables: {} },
      buildingSchemaId: 'test-id',
      latestVersionNumber: 1,
      organizationId: 'test-org-id',
      userId: 'user-id',
      designSessionId: 'session-id',
      retryCount: {},
      ...overrides,
    }
  }

  const createRepositories = (): Repositories => {
    return {
      schema: new InMemoryRepository(),
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

    const repositories = createRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories },
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

    const repositories = createRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories },
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

    const repositories = createRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories },
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

    const repositories = createRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories },
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

    const repositories = createRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories },
    })

    expect(result.dmlExecutionSuccessful).toBeUndefined()
    expect(result.dmlExecutionErrors).toContain('Table not found')
  })

  it('should trim whitespace from statements', async () => {
    const state = createMockState({
      ddlStatements: '   ',
      dmlStatements: '   ',
    })

    const repositories = createRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories },
    })

    expect(executeQuery).not.toHaveBeenCalled()
    expect(result).toEqual(state)
  })
})
