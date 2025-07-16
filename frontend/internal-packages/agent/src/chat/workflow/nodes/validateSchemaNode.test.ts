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
        createTimelineItem: vi.fn().mockResolvedValue({}),
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
    await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(executeQuery).not.toHaveBeenCalled()
  })

  it('should execute DML statements for each use case', async () => {
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
      generatedUsecases: [
        {
          requirementType: 'functional',
          requirementCategory: 'User Management',
          requirement: 'Users should be able to register',
          title: 'User Registration',
          description: 'Allow users to create new accounts',
        },
      ],
    })

    const repositories = createMockRepositories()
    await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(executeQuery).toHaveBeenCalledWith(
      'session-id',
      'INSERT INTO users VALUES (1, "test")',
    )
    expect(repositories.schema.createTimelineItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dml_execution_result',
        content: expect.stringContaining('User Registration'),
      }),
    )
  })

  it('should return early when no DML statements provided', async () => {
    const state = createMockState({
      dmlStatements: '',
      generatedUsecases: [
        {
          requirementType: 'functional',
          requirementCategory: 'User Management',
          requirement: 'Users should be able to register',
          title: 'User Registration',
          description: 'Allow users to create new accounts',
        },
      ],
    })

    const repositories = createMockRepositories()
    await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(executeQuery).not.toHaveBeenCalled()
    expect(repositories.schema.createTimelineItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'assistant_log',
        content: 'No DML statements to execute for validation',
      }),
    )
  })

  it('should return early when no use cases provided', async () => {
    const state = createMockState({
      dmlStatements: 'INSERT INTO users VALUES (1);',
      generatedUsecases: [],
    })

    const repositories = createMockRepositories()
    await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(executeQuery).not.toHaveBeenCalled()
    expect(repositories.schema.createTimelineItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'assistant_log',
        content: 'No use cases available for DML validation',
      }),
    )
  })

  it('should handle execution errors and log them', async () => {
    const mockResults: SqlResult[] = [
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
      dmlStatements: 'INSERT INTO invalid_table VALUES (1);',
      generatedUsecases: [
        {
          requirementType: 'functional',
          requirementCategory: 'User Management',
          requirement: 'Users should be able to register',
          title: 'User Registration',
          description: 'Allow users to create new accounts',
        },
      ],
    })

    const repositories = createMockRepositories()
    await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(repositories.schema.createTimelineItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dml_execution_result',
        content: expect.stringContaining('"success":false'),
      }),
    )
    expect(repositories.schema.createTimelineItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dml_execution_result',
        content: expect.stringContaining('Table not found'),
      }),
    )
  })

  it('should trim whitespace from statements', async () => {
    const state = createMockState({
      ddlStatements: '   ',
      dmlStatements: '   ',
    })

    const repositories = createMockRepositories()
    await validateSchemaNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(executeQuery).not.toHaveBeenCalled()
  })
})
