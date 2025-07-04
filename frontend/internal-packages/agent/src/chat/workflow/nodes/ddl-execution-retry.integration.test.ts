import { aColumn, aTable } from '@liam-hq/db-structure'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkflowState } from '../types'
import { designSchemaNode } from './designSchemaNode'
import { executeDDLNode } from './executeDDLNode'
import { generateDDLNode } from './generateDDLNode'

// Mock all external dependencies
vi.mock('@liam-hq/pglite-server', () => ({
  executeQuery: vi.fn(),
}))

vi.mock('../../../langchain/agents', () => ({
  DatabaseSchemaBuildAgent: vi.fn().mockImplementation(() => ({
    generate: vi.fn(),
  })),
}))

describe('DDL Execution Retry Integration Test', () => {
  const mockLogger = {
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }

  const mockRepository = {
    schema: {
      createVersion: vi.fn(),
    },
  }

  const createInitialState = (): WorkflowState => ({
    userInput: 'Add todos table with foreign key to users',
    schemaData: {
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
          },
          constraints: {}, // Missing PRIMARY KEY constraint - this will cause DDL failure
        }),
      },
    },
    logger: mockLogger,
    onNodeProgress: undefined,
    formattedHistory: '',
    retryCount: {},
    buildingSchemaId: 'test-schema',
    latestVersionNumber: 1,
    userId: 'test-user',
    designSessionId: 'test-session',
    repositories: mockRepository as never,
    ddlStatements: '',
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete full retry workflow: designSchema -> generateDDL -> executeDDL -> retry -> success', async () => {
    const { executeQuery } = await import('@liam-hq/pglite-server')
    const { DatabaseSchemaBuildAgent } = await import(
      '../../../langchain/agents'
    )

    // Step 1: Initial designSchema creates schema without PRIMARY KEY
    const initialDesignMock = vi.fn().mockResolvedValue({
      message: 'Added todos table with foreign key to users',
      schemaChanges: [
        {
          op: 'add',
          path: '/tables/todos',
          value: {
            name: 'todos',
            columns: {
              id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
              user_id: aColumn({
                name: 'user_id',
                type: 'uuid',
                notNull: true,
              }),
            },
            constraints: {
              todos_user_fk: {
                name: 'todos_user_fk',
                type: 'FOREIGN KEY',
                columnName: 'user_id',
                targetTableName: 'users',
                targetColumnName: 'id',
                deleteConstraint: 'CASCADE',
                updateConstraint: 'NO_ACTION',
              },
            },
          },
        },
      ],
    })

    // Step 2: Retry designSchema adds missing PRIMARY KEY constraint
    const retryDesignMock = vi.fn().mockResolvedValue({
      message: 'Added missing PRIMARY KEY constraint to users table',
      schemaChanges: [
        {
          op: 'add',
          path: '/tables/users/constraints/users_pkey',
          value: {
            name: 'users_pkey',
            type: 'PRIMARY KEY',
            columnName: 'id',
          },
        },
      ],
    })

    vi.mocked(DatabaseSchemaBuildAgent).mockImplementation(
      () =>
        ({
          generate: vi
            .fn()
            .mockImplementationOnce(initialDesignMock)
            .mockImplementationOnce(retryDesignMock),
        }) as never,
    )

    // Mock successful repository operations
    mockRepository.schema.createVersion.mockResolvedValue({
      success: true,
    })

    // Mock DDL execution: first attempt fails, second succeeds
    const failedDDLResults: SqlResult[] = [
      {
        id: '1',
        success: true,
        sql: 'CREATE TABLE "users" ...',
        result: {},
        metadata: { executionTime: 100, timestamp: '2024-01-01T00:00:00Z' },
      },
      {
        id: '2',
        success: false,
        sql: 'ALTER TABLE "todos" ADD CONSTRAINT "todos_user_fk" FOREIGN KEY ("user_id") REFERENCES "users" ("id")',
        result: {
          error:
            'there is no unique constraint matching given keys for referenced table "users"',
        },
        metadata: { executionTime: 50, timestamp: '2024-01-01T00:00:00Z' },
      },
    ]

    const successDDLResults: SqlResult[] = [
      {
        id: '1',
        success: true,
        sql: 'ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id")',
        result: {},
        metadata: { executionTime: 100, timestamp: '2024-01-01T00:00:00Z' },
      },
      {
        id: '2',
        success: true,
        sql: 'ALTER TABLE "todos" ADD CONSTRAINT "todos_user_fk" FOREIGN KEY ("user_id") REFERENCES "users" ("id")',
        result: {},
        metadata: { executionTime: 100, timestamp: '2024-01-01T00:00:00Z' },
      },
    ]

    vi.mocked(executeQuery)
      .mockResolvedValueOnce(failedDDLResults)
      .mockResolvedValueOnce(successDDLResults)

    // WORKFLOW SIMULATION
    let state = createInitialState()

    // Step 1: Initial designSchema
    state = await designSchemaNode(state)
    expect(state.error).toBeUndefined()
    expect(state.schemaData.tables['todos']).toBeDefined()

    // Step 2: Generate DDL
    state = await generateDDLNode(state)
    expect(state.ddlStatements).toContain('FOREIGN KEY')

    // Step 3: Execute DDL (fails)
    state = await executeDDLNode(state)
    expect(state.shouldRetryWithDesignSchema).toBe(true)
    expect(state.ddlExecutionFailureReason).toContain(
      'there is no unique constraint matching given keys',
    )
    expect(state.retryCount['ddlExecutionRetry']).toBe(1)

    // Step 4: Retry designSchema (with DDL failure context)
    state = await designSchemaNode(state)
    expect(state.shouldRetryWithDesignSchema).toBeUndefined() // Should be cleared
    expect(state.ddlExecutionFailureReason).toBeUndefined() // Should be cleared
    expect(
      state.schemaData.tables['users']?.constraints['users_pkey'],
    ).toBeDefined()

    // Step 5: Generate DDL again
    state = await generateDDLNode(state)
    expect(state.ddlStatements).toContain('PRIMARY KEY')

    // Step 6: Execute DDL (succeeds)
    state = await executeDDLNode(state)
    expect(state.shouldRetryWithDesignSchema).toBeUndefined()
    expect(state.ddlExecutionFailed).toBeUndefined()

    // Verify the complete flow
    expect(initialDesignMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_message: 'Add todos table with foreign key to users',
      }),
    )

    expect(retryDesignMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_message: expect.stringContaining('DDL execution failed'),
      }),
    )

    expect(executeQuery).toHaveBeenCalledTimes(2)
    expect(mockLogger.log).toHaveBeenCalledWith(
      '[designSchemaNode] Retrying after DDL execution failure',
    )
    expect(mockLogger.log).toHaveBeenCalledWith(
      '[executeDDLNode] DDL executed successfully',
    )
  })

  it('should fail gracefully after retry limit is reached', async () => {
    const { executeQuery } = await import('@liam-hq/pglite-server')
    const { DatabaseSchemaBuildAgent } = await import(
      '../../../langchain/agents'
    )

    // Mock agent that doesn't fix the issue
    const mockGenerate = vi.fn().mockResolvedValue({
      message: 'Unable to fix the constraint issue',
      schemaChanges: [], // No changes made
    })

    vi.mocked(DatabaseSchemaBuildAgent).mockImplementation(
      () =>
        ({
          generate: mockGenerate,
        }) as never,
    )

    mockRepository.schema.createVersion.mockResolvedValue({
      success: true,
    })

    // Mock DDL execution that always fails
    const failedResults: SqlResult[] = [
      {
        id: '1',
        success: false,
        sql: 'ALTER TABLE "todos" ADD CONSTRAINT ...',
        result: { error: 'constraint error' },
        metadata: { executionTime: 50, timestamp: '2024-01-01T00:00:00Z' },
      },
    ]

    vi.mocked(executeQuery).mockResolvedValue(failedResults)

    let state = createInitialState()
    state.ddlStatements = 'ALTER TABLE "todos" ADD CONSTRAINT ...'

    // First failure - should retry
    state = await executeDDLNode(state)
    expect(state.shouldRetryWithDesignSchema).toBe(true)
    expect(state.retryCount['ddlExecutionRetry']).toBe(1)

    // Retry with designSchema (but doesn't fix the issue)
    state = await designSchemaNode(state)

    // Generate DDL again
    state = await generateDDLNode(state)

    // Second failure - should fail permanently
    state = await executeDDLNode(state)
    expect(state.ddlExecutionFailed).toBe(true)
    expect(state.shouldRetryWithDesignSchema).toBeUndefined()

    expect(mockLogger.log).toHaveBeenCalledWith(
      '[executeDDLNode] DDL execution failed after retry, marking as failed',
    )
  })
})
