import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DMLOperation } from '../../../langchain/agents/dmlGenerationAgent/agent'
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
      organizationId: 'test-org-id',
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
        createEmptyPatchVersion: vi.fn(),
        updateVersion: vi.fn(),
        createTimelineItem: vi.fn().mockResolvedValue({
          success: true,
          timelineItem: { id: 'mock-timeline-id' },
        }),
        createArtifact: vi.fn(),
        updateArtifact: vi.fn(),
        getArtifact: vi.fn(),
        createValidationQuery: vi.fn().mockResolvedValue({
          success: true,
          queryId: 'mock-query-id',
        }),
        createValidationResults: vi.fn().mockResolvedValue({
          success: true,
        }),
        createWorkflowRun: vi.fn(),
        updateWorkflowRunStatus: vi.fn(),
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
    const mockDdlResult: SqlResult[] = [
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

    const mockDmlResult: SqlResult[] = [
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
      .mockResolvedValueOnce(mockDdlResult)
      .mockResolvedValueOnce(mockDmlResult)

    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
      dmlStatements: 'INSERT INTO users VALUES (1);',
    })

    const repositories = createMockRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    // Should now execute DDL and DML separately
    expect(executeQuery).toHaveBeenCalledWith(
      'session-id',
      'CREATE TABLE users (id INT);',
    )
    expect(executeQuery).toHaveBeenCalledWith(
      'session-id',
      'INSERT INTO users VALUES (1);',
    )
    expect(executeQuery).toHaveBeenCalledTimes(2)
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

  it('should execute DML operations individually', async () => {
    const mockOperations: DMLOperation[] = [
      {
        sql: "INSERT INTO users (id, email) VALUES (1, 'test@example.com')",
        operationType: 'INSERT',
        purpose: 'Create test user',
        expectedOutcome: 'User created successfully',
        order: 1,
      },
      {
        sql: "SELECT * FROM users WHERE email = 'test@example.com'",
        operationType: 'SELECT',
        purpose: 'Verify user exists',
        expectedOutcome: 'Should return the created user',
        order: 2,
      },
    ]

    const mockResults: SqlResult[] = [
      {
        success: true,
        sql: mockOperations[0]?.sql ?? '',
        result: { rows: [], columns: [] },
        id: 'result-1',
        metadata: {
          executionTime: 5,
          timestamp: new Date().toISOString(),
        },
      },
      {
        success: true,
        sql: mockOperations[1]?.sql ?? '',
        result: {
          rows: [{ id: 1, email: 'test@example.com' }],
          columns: ['id', 'email'],
        },
        id: 'result-2',
        metadata: {
          executionTime: 3,
          timestamp: new Date().toISOString(),
        },
      },
    ]

    vi.mocked(executeQuery)
      .mockResolvedValueOnce(mockResults.slice(0, 1))
      .mockResolvedValueOnce(mockResults.slice(1, 2))

    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT, email VARCHAR);',
      dmlOperations: [
        {
          usecase: {
            requirementType: 'functional',
            requirementCategory: 'User Management',
            requirement: 'Users should be able to register',
            title: 'User Registration',
            description: 'Allow users to create new accounts',
          },
          operations: mockOperations,
        },
      ],
    })

    const repositories = createMockRepositories()

    // Reset mock and set up proper responses
    vi.mocked(executeQuery).mockReset()
    vi.mocked(executeQuery)
      .mockResolvedValueOnce([
        {
          success: true,
          sql: 'CREATE TABLE users (id INT, email VARCHAR);',
          result: { rows: [], columns: [] },
          id: 'ddl-result',
          metadata: {
            executionTime: 10,
            timestamp: new Date().toISOString(),
          },
        },
      ])
      .mockResolvedValueOnce(mockResults.slice(0, 1))
      .mockResolvedValueOnce(mockResults.slice(1, 2))

    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    // Should execute DDL first
    expect(executeQuery).toHaveBeenCalledWith(
      'session-id',
      'CREATE TABLE users (id INT, email VARCHAR);',
    )

    // Then execute each DML operation individually
    expect(executeQuery).toHaveBeenCalledWith(
      'session-id',
      mockOperations[0]?.sql,
    )
    expect(executeQuery).toHaveBeenCalledWith(
      'session-id',
      mockOperations[1]?.sql,
    )

    expect(executeQuery).toHaveBeenCalledTimes(3)
    expect(result.dmlExecutionSuccessful).toBe(true)
  })

  it('should handle errors in individual DML operations', async () => {
    const mockOperations: DMLOperation[] = [
      {
        sql: "INSERT INTO users (id, email) VALUES (1, 'user1@test.com')",
        operationType: 'INSERT',
        purpose: 'Create first user',
        expectedOutcome: 'User 1 created',
        order: 1,
      },
      {
        sql: 'INSERT INTO invalid_table VALUES (1)',
        operationType: 'INSERT',
        purpose: 'Invalid insert',
        expectedOutcome: 'Should fail',
        order: 2,
      },
      {
        sql: 'SELECT COUNT(*) FROM users',
        operationType: 'SELECT',
        purpose: 'Count users',
        expectedOutcome: 'Should return 1',
        order: 3,
      },
    ]

    const ddlResult: SqlResult = {
      success: true,
      sql: 'CREATE TABLE users (id INT, email VARCHAR);',
      result: { rows: [], columns: [] },
      id: 'ddl-result',
      metadata: {
        executionTime: 10,
        timestamp: new Date().toISOString(),
      },
    }

    const dmlResults: SqlResult[] = [
      {
        success: true,
        sql: mockOperations[0]?.sql ?? '',
        result: { rows: [], columns: [] },
        id: 'result-1',
        metadata: {
          executionTime: 5,
          timestamp: new Date().toISOString(),
        },
      },
      {
        success: false,
        sql: mockOperations[1]?.sql ?? '',
        result: { error: 'Table invalid_table does not exist' },
        id: 'result-2',
        metadata: {
          executionTime: 2,
          timestamp: new Date().toISOString(),
        },
      },
      {
        success: true,
        sql: mockOperations[2]?.sql ?? '',
        result: { rows: [{ count: 1 }], columns: ['count'] },
        id: 'result-3',
        metadata: {
          executionTime: 3,
          timestamp: new Date().toISOString(),
        },
      },
    ]

    vi.mocked(executeQuery)
      .mockResolvedValueOnce([ddlResult])
      .mockResolvedValueOnce(dmlResults.slice(0, 1))
      .mockResolvedValueOnce(dmlResults.slice(1, 2))
      .mockResolvedValueOnce(dmlResults.slice(2, 3))

    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT, email VARCHAR);',
      dmlOperations: [
        {
          usecase: {
            requirementType: 'functional',
            requirementCategory: 'User Management',
            requirement: 'Test error handling',
            title: 'Error Test',
            description: 'Test with invalid table',
          },
          operations: mockOperations,
        },
      ],
    })

    const repositories = createMockRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(result.dmlExecutionSuccessful).toBeUndefined()
    expect(result.dmlExecutionErrors).toContain(
      'Table invalid_table does not exist',
    )
    expect(result.dmlExecutionErrors).toContain('Use case: Error Test')
  })

  it('should process multiple use cases', async () => {
    const mockOperations1: DMLOperation[] = [
      {
        sql: "INSERT INTO users (id, email) VALUES (1, 'user1@test.com')",
        operationType: 'INSERT',
        purpose: 'Create user 1',
        expectedOutcome: 'User 1 created',
        order: 1,
      },
    ]

    const mockOperations2: DMLOperation[] = [
      {
        sql: "UPDATE users SET email = 'updated@test.com' WHERE id = 1",
        operationType: 'UPDATE',
        purpose: 'Update user email',
        expectedOutcome: 'Email updated',
        order: 1,
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue([
      {
        success: true,
        sql: '',
        result: { rows: [], columns: [] },
        id: 'result',
        metadata: {
          executionTime: 5,
          timestamp: new Date().toISOString(),
        },
      },
    ])

    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT, email VARCHAR);',
      dmlOperations: [
        {
          usecase: {
            requirementType: 'functional',
            requirementCategory: 'User Management',
            requirement: 'User registration',
            title: 'User Registration',
            description: 'Create new users',
          },
          operations: mockOperations1,
        },
        {
          usecase: {
            requirementType: 'functional',
            requirementCategory: 'User Management',
            requirement: 'Profile update',
            title: 'Profile Update',
            description: 'Update user information',
          },
          operations: mockOperations2,
        },
      ],
    })

    const repositories = createMockRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    // DDL + 2 DML operations
    expect(executeQuery).toHaveBeenCalledTimes(3)
    expect(result.dmlExecutionSuccessful).toBe(true)
  })
})
