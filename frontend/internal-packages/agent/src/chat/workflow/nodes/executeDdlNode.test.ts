import type { RunnableConfig } from '@langchain/core/runnables'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repositories } from '../../../repositories'
import type { WorkflowState } from '../types'
import { executeDdlNode } from './executeDdlNode'

vi.mock('@liam-hq/db-structure', () => ({
  postgresqlSchemaDeparser: vi.fn(),
}))

vi.mock('@liam-hq/pglite-server', () => ({
  executeQuery: vi.fn(),
}))

vi.mock('../utils/timelineLogger', () => ({
  logAssistantMessage: vi.fn(),
  logDDLExecutionResult: vi.fn(),
}))

describe('executeDdlNode', () => {
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
      schemaData: {
        tables: {
          users: {
            name: 'users',
            columns: {
              id: {
                name: 'id',
                type: 'SERIAL',
                default: null,
                check: null,
                notNull: true,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {},
          },
        },
      },
      retryCount: {},
      buildingSchemaId: 'test-schema-id',
      latestVersionNumber: 1,
      userId: 'test-user-id',
      designSessionId: 'test-session-id',
    }

    mockConfig = {
      configurable: {
        repositories: mockRepositories,
        logger: { log: vi.fn() },
      },
    }
  })

  it('should execute DDL successfully and log execution result', async () => {
    const { postgresqlSchemaDeparser } = await import('@liam-hq/db-structure')
    const { executeQuery } = await import('@liam-hq/pglite-server')
    const { logDDLExecutionResult } = await import('../utils/timelineLogger')

    const ddlStatements = 'CREATE TABLE users (id SERIAL PRIMARY KEY);'

    vi.mocked(postgresqlSchemaDeparser).mockReturnValue({
      value: ddlStatements,
      errors: [],
    })

    const mockResults = [
      {
        sql: ddlStatements,
        result: { command: 'CREATE', rowCount: 0 },
        success: true,
        id: 'test-id',
        metadata: {
          executionTime: 100,
          timestamp: '2025-01-01T00:00:00Z',
        },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(mockResults)

    const result = await executeDdlNode(mockState, mockConfig)

    expect(logDDLExecutionResult).toHaveBeenCalledWith(
      mockState,
      mockRepositories,
      expect.objectContaining({
        statements: [ddlStatements],
        results: mockResults,
        success: true,
        executionTime: expect.any(Number),
      }),
    )

    expect(result).toEqual({
      ...mockState,
      ddlStatements,
    })
  })

  it('should handle DDL execution errors and log failure result', async () => {
    const { postgresqlSchemaDeparser } = await import('@liam-hq/db-structure')
    const { executeQuery } = await import('@liam-hq/pglite-server')
    const { logDDLExecutionResult } = await import('../utils/timelineLogger')

    const ddlStatements = 'INVALID SQL;'

    vi.mocked(postgresqlSchemaDeparser).mockReturnValue({
      value: ddlStatements,
      errors: [],
    })

    const mockResults = [
      {
        sql: ddlStatements,
        result: { error: 'syntax error' },
        success: false,
        id: 'test-id',
        metadata: {
          executionTime: 10,
          timestamp: '2025-01-01T00:00:00Z',
        },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(mockResults)

    const result = await executeDdlNode(mockState, mockConfig)

    expect(logDDLExecutionResult).toHaveBeenCalledWith(
      mockState,
      mockRepositories,
      expect.objectContaining({
        statements: [ddlStatements],
        results: mockResults,
        success: false,
        errors: expect.arrayContaining([
          expect.stringContaining('syntax error'),
        ]),
        executionTime: expect.any(Number),
      }),
    )

    expect(result.shouldRetryWithDesignSchema).toBe(true)
  })
})
