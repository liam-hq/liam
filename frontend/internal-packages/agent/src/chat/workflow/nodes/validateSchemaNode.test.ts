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
      schemaData: { tables: {}, enums: {} },
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
      ddlStatements: '',
      dmlOperations: [
        {
          useCaseId: 'usecase-1',
          operation_type: 'INSERT',
          sql: 'INSERT INTO users VALUES (1, "test");',
          dml_execution_logs: [],
        },
      ],
      generatedUsecases: [
        {
          id: 'usecase-1',
          requirementType: 'functional',
          requirementCategory: 'data_management',
          requirement: 'Insert user data',
          title: 'Insert User',
          description: 'Insert a new user record',
          dmlOperations: [
            {
              useCaseId: 'usecase-1',
              operation_type: 'INSERT',
              sql: 'INSERT INTO users VALUES (1, "test");',
              dml_execution_logs: [],
            },
          ],
        },
      ],
    })

    const repositories = createRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories },
    })

    expect(executeQuery).toHaveBeenCalledWith(
      'session-id',
      expect.stringContaining('INSERT INTO users VALUES (1, "test");'),
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

  it('should execute DDL first then DML individually', async () => {
    const ddlMockResults: SqlResult[] = [
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

    const dmlMockResults: SqlResult[] = [
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

    vi.mocked(executeQuery)
      .mockResolvedValueOnce(ddlMockResults)
      .mockResolvedValueOnce(dmlMockResults)

    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
      dmlOperations: [
        {
          useCaseId: 'usecase-1',
          operation_type: 'INSERT',
          sql: 'INSERT INTO users VALUES (1);',
          dml_execution_logs: [],
        },
      ],
      generatedUsecases: [
        {
          id: 'usecase-1',
          requirementType: 'functional',
          requirementCategory: 'data_management',
          requirement: 'Insert user data',
          title: 'Insert User',
          description: 'Insert a new user record',
          dmlOperations: [
            {
              useCaseId: 'usecase-1',
              operation_type: 'INSERT',
              sql: 'INSERT INTO users VALUES (1);',
              dml_execution_logs: [],
            },
          ],
        },
      ],
    })

    const repositories = createRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories },
    })

    expect(executeQuery).toHaveBeenCalledTimes(2)
    // First call should be DDL only
    expect(executeQuery).toHaveBeenNthCalledWith(
      1,
      'session-id',
      'CREATE TABLE users (id INT);',
    )
    // Second call should include both DDL and DML combined
    expect(executeQuery).toHaveBeenNthCalledWith(
      2,
      'session-id',
      expect.stringContaining('CREATE TABLE users (id INT);'),
    )
    expect(executeQuery).toHaveBeenNthCalledWith(
      2,
      'session-id',
      expect.stringContaining('INSERT INTO users VALUES (1);'),
    )
    expect(result.dmlExecutionSuccessful).toBe(true)
  })

  it('should handle execution errors', async () => {
    const ddlMockResults: SqlResult[] = [
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

    const dmlMockResults: SqlResult[] = [
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

    vi.mocked(executeQuery)
      .mockResolvedValueOnce(ddlMockResults)
      .mockResolvedValueOnce(dmlMockResults)

    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
      dmlOperations: [
        {
          useCaseId: 'usecase-1',
          operation_type: 'INSERT',
          sql: 'INSERT INTO invalid_table VALUES (1);',
          dml_execution_logs: [],
        },
      ],
      generatedUsecases: [
        {
          id: 'usecase-1',
          requirementType: 'functional',
          requirementCategory: 'data_management',
          requirement: 'Insert invalid data',
          title: 'Insert Invalid Data',
          description: 'Attempt to insert data into invalid table',
          dmlOperations: [
            {
              useCaseId: 'usecase-1',
              operation_type: 'INSERT',
              sql: 'INSERT INTO invalid_table VALUES (1);',
              dml_execution_logs: [],
            },
          ],
        },
      ],
    })

    const repositories = createRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories },
    })

    expect(result.dmlExecutionSuccessful).toBeUndefined()
    expect(result.dmlExecutionErrors).toContain('SQL: UseCase:')
    expect(result.dmlExecutionErrors).toContain('Error:')
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
