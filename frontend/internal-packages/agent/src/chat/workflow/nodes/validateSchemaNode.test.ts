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
      configurable: { repositories, thread_id: 'test-thread' },
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
      configurable: { repositories, thread_id: 'test-thread' },
    })

    expect(executeQuery).toHaveBeenCalledWith(
      'session-id',
      expect.stringContaining('INSERT INTO users VALUES (1, "test");'),
    )
    expect(result.dmlExecutionErrors).toBeUndefined()
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
      configurable: { repositories, thread_id: 'test-thread' },
    })

    expect(executeQuery).toHaveBeenCalledWith(
      'session-id',
      'CREATE TABLE users (id INT);',
    )
    expect(result.dmlExecutionErrors).toBeUndefined()
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
      configurable: { repositories, thread_id: 'test-thread' },
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
    expect(result.dmlExecutionErrors).toBeUndefined()
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
      configurable: { repositories, thread_id: 'test-thread' },
    })

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
      configurable: { repositories, thread_id: 'test-thread' },
    })

    expect(executeQuery).not.toHaveBeenCalled()
    expect(result).toEqual(state)
  })

  it('should execute DML operations from each usecase', async () => {
    // This test verifies that validateSchemaNode executes DML operations
    // found in each usecase's dmlOperations array

    const sqlResults: SqlResult[] = [
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

    vi.mocked(executeQuery).mockResolvedValue(sqlResults)

    const state = createMockState({
      ddlStatements: '',
      dmlStatements: 'INSERT INTO users VALUES (1, "test");',
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
      configurable: { repositories, thread_id: 'test-thread' },
    })

    // Verify that DML operations were executed
    expect(executeQuery).toHaveBeenCalledWith(
      'session-id',
      expect.stringContaining('INSERT INTO users VALUES (1, "test");'),
    )

    // Verify execution was successful
    expect(result.dmlExecutionErrors).toBeUndefined()

    // Verify execution logs were added to the usecase's DML operations
    expect(result.generatedUsecases).toBeDefined()
    const firstUsecase = result.generatedUsecases?.[0]
    expect(firstUsecase).toBeDefined()
    expect(firstUsecase?.dmlOperations).toBeDefined()
    const firstDmlOp = firstUsecase?.dmlOperations?.[0]
    expect(firstDmlOp).toBeDefined()
    expect(firstDmlOp?.dml_execution_logs).toBeDefined()
    const executionLogs = firstDmlOp?.dml_execution_logs ?? []
    expect(executionLogs).toHaveLength(1)
    expect(executionLogs[0]?.success).toBe(true)
  })
})
