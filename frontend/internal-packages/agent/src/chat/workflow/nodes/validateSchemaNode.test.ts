import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { aColumn, aSchema, aTable } from '@liam-hq/schema'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repositories } from '../../../repositories'
import { InMemoryRepository } from '../../../repositories/InMemoryRepository'
import type { WorkflowState } from '../types'
import { validateSchemaNode } from './validateSchemaNode'

describe('validateSchemaNode', () => {
  beforeAll(async () => {
    await executeQuery('warmup', 'SELECT 1')
  }, 30000)

  const createMockState = (
    overrides?: Partial<WorkflowState>,
  ): WorkflowState => {
    return {
      messages: [],
      userInput: 'test',
      schemaData: aSchema({ tables: {} }),
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
    })

    const repositories = createRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, thread_id: 'test-thread' },
    })

    expect(result).toEqual(state)
  })

  it('should execute only DML when DDL is empty', async () => {
    const state = createMockState({
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
              sql: "INSERT INTO users VALUES (1, 'test');",
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

    expect(result.dmlExecutionErrors).toBeUndefined()
  }, 15000)

  it('should execute only DDL when DML is empty', async () => {
    const state = createMockState({
      schemaData: aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'INT', notNull: true }),
            },
          }),
        },
      }),
      dmlStatements: '',
    })

    const repositories = createRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, thread_id: 'test-thread' },
    })

    expect(result.dmlExecutionErrors).toBeUndefined()
  }, 15000)

  it('should execute DDL first then DML individually', async () => {
    const state = createMockState({
      schemaData: aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'INT', notNull: true }),
            },
          }),
        },
      }),
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

    expect(result.dmlExecutionErrors).toBeUndefined()
  }, 15000)

  it('should handle execution errors', async () => {
    const state = createMockState({
      schemaData: aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'INT', notNull: true }),
            },
          }),
        },
      }),
      generatedUsecases: [
        {
          id: 'usecase-1',
          requirementType: 'functional',
          requirementCategory: 'data_management',
          requirement: 'Insert invalid data',
          title: 'Insert Invalid Data',
          description: 'Attempt to insert data with wrong column count',
          dmlOperations: [
            {
              useCaseId: 'usecase-1',
              operation_type: 'INSERT',
              sql: "INSERT INTO users VALUES (1, 'extra_column', 'too_many');",
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
  }, 15000)

  it('should trim whitespace from statements', async () => {
    const state = createMockState({
      dmlStatements: '   ',
    })

    const repositories = createRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, thread_id: 'test-thread' },
    })

    expect(result).toEqual(state)
  })

  it('should set dmlExecutionErrors when DDL execution fails', async () => {
    const ddlMockResults: SqlResult[] = [
      {
        success: false,
        sql: 'CREATE TABLE "users" ("id" INT NOT NULL);',
        result: { error: 'Syntax error in DDL statement' },
        id: 'result-1',
        metadata: {
          executionTime: 10,
          timestamp: new Date().toISOString(),
        },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValueOnce(ddlMockResults)

    const state = createMockState({
      dmlStatements: '',
      schemaData: aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'INT', notNull: true }),
            },
          }),
        },
      }),
    })

    const repositories = createRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, thread_id: 'test-thread' },
    })

    // Verify that error message is set with the expected format
    expect(result.dmlExecutionErrors).toBe(
      'SQL: CREATE TABLE "users" ("id" INT NOT NULL);, Error: {"error":"Syntax error in DDL statement"}',
    )
  })

  it('should set dmlExecutionErrors with multiple error details', async () => {
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

    // Simulate multiple DML operations failing
    const dmlMockResults1: SqlResult[] = [
      {
        success: false,
        sql: 'INSERT INTO users VALUES (1);',
        result: 'Column count mismatch',
        id: 'result-2',
        metadata: {
          executionTime: 2,
          timestamp: new Date().toISOString(),
        },
      },
    ]

    const dmlMockResults2: SqlResult[] = [
      {
        success: false,
        sql: 'UPDATE users SET name = "test";',
        result: 'Column "name" does not exist',
        id: 'result-3',
        metadata: {
          executionTime: 2,
          timestamp: new Date().toISOString(),
        },
      },
    ]

    vi.mocked(executeQuery)
      .mockResolvedValueOnce(ddlMockResults)
      .mockResolvedValueOnce(dmlMockResults1)
      .mockResolvedValueOnce(dmlMockResults2)

    const state = createMockState({
      schemaData: aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'INT', notNull: true }),
            },
          }),
        },
      }),
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
        {
          id: 'usecase-2',
          requirementType: 'functional',
          requirementCategory: 'data_management',
          requirement: 'Update user data',
          title: 'Update User',
          description: 'Update user record',
          dmlOperations: [
            {
              useCaseId: 'usecase-2',
              operation_type: 'UPDATE',
              sql: 'UPDATE users SET name = "test";',
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

    // Verify that all error messages are accumulated
    expect(result.dmlExecutionErrors).toBe(
      'SQL: UseCase: Insert User, Error: {"errors":["Column count mismatch"]}; SQL: UseCase: Update User, Error: {"errors":["Column \\"name\\" does not exist"]}',
    )
  })

  it('should preserve existing dmlExecutionErrors when no new errors occur', async () => {
    // TODO: Current implementation preserves errors even on success, causing validation to never succeed
    // Need to fix the implementation to clear dmlExecutionErrors when execution is successful
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
      dmlStatements: '',
      dmlExecutionErrors: 'Previous error message', // Pre-existing error
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

    // Current implementation doesn't clear previous errors on success
    // This test documents the actual behavior
    expect(result.dmlExecutionErrors).toBe('Previous error message')
  })

  it('should execute DML operations from each usecase', async () => {
    const state = createMockState({
      dmlStatements: "INSERT INTO users VALUES (1, 'test');",
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
              sql: "INSERT INTO users VALUES (1, 'test');",
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

    expect(result.dmlExecutionErrors).toBeUndefined()

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
  }, 15000)
})
