import { aColumn, aTable } from '@liam-hq/db-structure'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkflowState } from '../types'
import { designSchemaNode } from './designSchemaNode'

// Mock the database schema build agent
vi.mock('../../../langchain/agents', () => ({
  DatabaseSchemaBuildAgent: vi.fn().mockImplementation(() => ({
    generate: vi.fn(),
  })),
}))

describe('designSchemaNode DDL retry handling', () => {
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

  const createMockState = (
    ddlExecutionFailureReason?: string,
    shouldRetryWithDesignSchema?: boolean,
  ): WorkflowState => ({
    userInput: 'Add todos table with foreign key to users',
    schemaData: {
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
          },
          constraints: {}, // Missing PRIMARY KEY constraint
        }),
        todos: aTable({
          name: 'todos',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
            user_id: aColumn({ name: 'user_id', type: 'uuid', notNull: true }),
          },
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
    shouldRetryWithDesignSchema,
    ddlExecutionFailureReason,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should include DDL failure context in prompt when retrying after DDL execution failure', async () => {
    // RED: This test will fail because designSchemaNode doesn't handle DDL retry context yet
    const { DatabaseSchemaBuildAgent } = await import(
      '../../../langchain/agents'
    )

    const mockGenerate = vi.fn().mockResolvedValue({
      message:
        'Added PRIMARY KEY constraint to users table to fix foreign key issue',
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
          generate: mockGenerate,
        }) as never,
    )

    mockRepository.schema.createVersion.mockResolvedValue({
      success: true,
    })

    const state = createMockState(
      'SQL: ALTER TABLE "todos" ADD CONSTRAINT "todos_user_fk" FOREIGN KEY ("user_id") REFERENCES "users" ("id"), Error: {"error":"there is no unique constraint matching given keys for referenced table \\"users\\""}',
      true,
    )

    await designSchemaNode(state)

    // Should include DDL failure context in the prompt
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        user_message: expect.stringContaining(
          'The following DDL execution failed',
        ),
      }),
    )

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        user_message: expect.stringContaining(
          'there is no unique constraint matching given keys',
        ),
      }),
    )

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        user_message: expect.stringContaining('Please fix this issue'),
      }),
    )
  })

  it('should use original user input when not retrying after DDL failure', async () => {
    const { DatabaseSchemaBuildAgent } = await import(
      '../../../langchain/agents'
    )

    const mockGenerate = vi.fn().mockResolvedValue({
      message: 'Added todos table structure',
      schemaChanges: [],
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

    const state = createMockState() // No DDL failure context

    await designSchemaNode(state)

    // Should use original user input without DDL failure context
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        user_message: 'Add todos table with foreign key to users',
      }),
    )

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.not.objectContaining({
        user_message: expect.stringContaining('DDL execution failed'),
      }),
    )
  })

  it('should clear retry flags after processing', async () => {
    const { DatabaseSchemaBuildAgent } = await import(
      '../../../langchain/agents'
    )

    const mockGenerate = vi.fn().mockResolvedValue({
      message: 'Fixed schema issues',
      schemaChanges: [],
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

    const state = createMockState('Some DDL error', true)

    const result = await designSchemaNode(state)

    // Should clear retry flags after processing
    expect(result.shouldRetryWithDesignSchema).toBeUndefined()
    expect(result.ddlExecutionFailureReason).toBeUndefined()
  })
})
