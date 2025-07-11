import type { RunnableConfig } from '@langchain/core/runnables'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repositories } from '../../../repositories'
import type { WorkflowState } from '../types'
import { validateSchemaNode } from './validateSchemaNode'

vi.mock('@liam-hq/pglite-server', () => ({
  executeQuery: vi.fn(),
}))

vi.mock('../utils/timelineLogger', () => ({
  logAssistantMessage: vi.fn(),
  logDMLExecutionResult: vi.fn(),
}))

describe('validateSchemaNode', () => {
  let mockState: WorkflowState
  let mockRepositories: Repositories
  let mockConfig: RunnableConfig

  beforeEach(() => {
    vi.clearAllMocks()

    mockRepositories = {
      schema: {
        createTimelineItem: vi.fn().mockResolvedValue({
          success: true,
          timelineItem: { id: 'test-timeline-id' },
        }),
        getSchema: vi.fn(),
        getDesignSession: vi.fn(),
        createVersion: vi.fn(),
        updateTimelineItem: vi.fn(),
        createArtifact: vi.fn(),
        updateArtifact: vi.fn(),
        getArtifact: vi.fn(),
      },
    }

    mockState = {
      messages: [],
      userInput: 'test input',
      schemaData: { tables: {} },
      retryCount: {},
      buildingSchemaId: 'test-schema-id',
      latestVersionNumber: 1,
      userId: 'test-user-id',
      designSessionId: 'test-session-id',
      dmlStatements:
        "INSERT INTO users (name) VALUES ('John Doe'); INSERT INTO posts (title, user_id) VALUES ('Hello World', 1);",
      generatedUsecases: [
        {
          requirementType: 'functional',
          title: 'Create User',
          description: 'Create a new user account',
          requirement: 'User registration functionality',
          requirementCategory: 'User Management',
        },
        {
          requirementType: 'functional',
          title: 'Create Post',
          description: 'Create a new blog post',
          requirement: 'Content creation functionality',
          requirementCategory: 'Content Management',
        },
      ],
    }

    mockConfig = {
      configurable: {
        repositories: mockRepositories,
        logger: { log: vi.fn() },
      },
    }
  })

  it('should execute DML statements for each usecase and log results', async () => {
    const { executeQuery } = await import('@liam-hq/pglite-server')
    const { logDMLExecutionResult } = await import('../utils/timelineLogger')

    const mockResults = [
      {
        sql: "INSERT INTO users (name) VALUES ('John Doe');",
        result: { command: 'INSERT', rowCount: 1 },
        success: true,
        id: 'test-id-1',
        metadata: {
          executionTime: 50,
          timestamp: '2025-01-01T00:00:00Z',
          affectedRows: 1,
        },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(mockResults)

    const result = await validateSchemaNode(mockState, mockConfig)

    expect(logDMLExecutionResult).toHaveBeenCalledTimes(2)

    expect(logDMLExecutionResult).toHaveBeenNthCalledWith(
      1,
      mockState,
      mockRepositories,
      expect.objectContaining({
        usecase: 'Create User',
        statements: expect.arrayContaining([expect.stringContaining('users')]),
        results: expect.arrayContaining(mockResults),
        success: true,
        executionTime: expect.any(Number),
      }),
    )

    expect(logDMLExecutionResult).toHaveBeenNthCalledWith(
      2,
      mockState,
      mockRepositories,
      expect.objectContaining({
        usecase: 'Create Post',
        statements: expect.arrayContaining([expect.stringContaining('users')]),
        results: expect.arrayContaining(mockResults),
        success: true,
        executionTime: expect.any(Number),
      }),
    )

    expect(result).toEqual(mockState)
  })

  it('should handle DML execution errors', async () => {
    const { executeQuery } = await import('@liam-hq/pglite-server')
    const { logDMLExecutionResult } = await import('../utils/timelineLogger')

    const mockResults = [
      {
        sql: 'INVALID SQL;',
        result: { error: 'syntax error' },
        success: false,
        id: 'test-id-1',
        metadata: {
          executionTime: 10,
          timestamp: '2025-01-01T00:00:00Z',
        },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(mockResults)

    mockState.dmlStatements = 'INVALID SQL;'
    mockState.generatedUsecases = [
      {
        requirementType: 'functional',
        title: 'Invalid Operation',
        description: 'Test invalid SQL',
        requirement: 'Test requirement',
        requirementCategory: 'Test',
      },
    ]

    await validateSchemaNode(mockState, mockConfig)

    expect(logDMLExecutionResult).toHaveBeenCalledWith(
      mockState,
      mockRepositories,
      expect.objectContaining({
        usecase: 'Invalid Operation',
        success: false,
        errors: expect.arrayContaining([
          expect.stringContaining('syntax error'),
        ]),
      }),
    )
  })

  it('should handle missing DML statements', async () => {
    const { logAssistantMessage } = await import('../utils/timelineLogger')

    mockState.dmlStatements = undefined

    const result = await validateSchemaNode(mockState, mockConfig)

    expect(logAssistantMessage).toHaveBeenCalledWith(
      mockState,
      mockRepositories,
      'No DML statements to execute for validation',
    )

    expect(result).toEqual(mockState)
  })

  it('should handle missing use cases', async () => {
    const { logAssistantMessage } = await import('../utils/timelineLogger')

    mockState.generatedUsecases = []

    const result = await validateSchemaNode(mockState, mockConfig)

    expect(logAssistantMessage).toHaveBeenCalledWith(
      mockState,
      mockRepositories,
      'No use cases available for DML validation',
    )

    expect(result).toEqual(mockState)
  })
})
