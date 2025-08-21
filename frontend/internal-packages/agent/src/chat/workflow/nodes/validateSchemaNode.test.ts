import { executeQuery } from '@liam-hq/pglite-server'
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

    expect(result).toEqual(state)
  })

  it('should execute only DML when DDL is empty', async () => {
    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT, name TEXT);',
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

    expect(result.dmlExecutionSuccessful).toBe(true)
  })

  it('should execute only DDL when DML is empty', async () => {
    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
      dmlStatements: '',
    })

    const repositories = createRepositories()
    const result = await validateSchemaNode(state, {
      configurable: { repositories, thread_id: 'test-thread' },
    })

    expect(result.dmlExecutionSuccessful).toBe(true)
  })

  it('should execute DDL first then DML individually', async () => {
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

    expect(result.dmlExecutionSuccessful).toBe(true)
  })

  it('should handle execution errors', async () => {
    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
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
      configurable: { repositories, thread_id: 'test-thread' },
    })

    expect(result).toEqual(state)
  })

  it('should execute DML operations from each usecase', async () => {
    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT, name TEXT);',
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

    expect(result.dmlExecutionSuccessful).toBe(true)

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
