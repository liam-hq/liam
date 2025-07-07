import { describe, expect, it, vi } from 'vitest'
import type { WorkflowState } from '../types'
import { designSchemaNode } from './designSchemaNode'
import { executeDdlNode } from './executeDdlNode'

vi.mock('@liam-hq/pglite-server', () => ({
  executeQuery: vi.fn(),
}))

const mockQASchemaGenerateAgent = vi.fn()

vi.mock('../../../langchain/agents', () => ({
  QASchemaGenerateAgent: mockQASchemaGenerateAgent,
}))

describe('DDL execution retry integration', () => {
  it('should successfully retry schema design after DDL failure', async () => {
    // Mock the schema generation agent
    const mockAgent = {
      generate: vi
        .fn()
        .mockResolvedValueOnce({
          // First attempt - will fail due to missing foreign key reference
          schema: {
            tables: {
              orders: {
                name: 'orders',
                columns: {
                  id: { name: 'id', type: 'bigint', notNull: true },
                  user_id: { name: 'user_id', type: 'bigint', notNull: true },
                },
                constraints: {
                  fk_user: {
                    name: 'fk_user',
                    type: 'FOREIGN KEY',
                    columnName: 'user_id',
                    targetTableName: 'users',
                    targetColumnName: 'id',
                  },
                },
              },
            },
          },
        })
        .mockResolvedValueOnce({
          // Second attempt - fixed by adding users table
          schema: {
            tables: {
              users: {
                name: 'users',
                columns: {
                  id: { name: 'id', type: 'bigint', notNull: true },
                },
                constraints: {
                  users_pkey: {
                    name: 'users_pkey',
                    type: 'PRIMARY KEY',
                    columnName: 'id',
                  },
                },
              },
              orders: {
                name: 'orders',
                columns: {
                  id: { name: 'id', type: 'bigint', notNull: true },
                  user_id: { name: 'user_id', type: 'bigint', notNull: true },
                },
                constraints: {
                  fk_user: {
                    name: 'fk_user',
                    type: 'FOREIGN KEY',
                    columnName: 'user_id',
                    targetTableName: 'users',
                    targetColumnName: 'id',
                  },
                },
              },
            },
          },
        }),
    }

    mockQASchemaGenerateAgent.mockImplementation(() => mockAgent)

    // Mock DDL execution
    const { executeQuery } = await import('@liam-hq/pglite-server')
    vi.mocked(executeQuery)
      .mockResolvedValueOnce([
        {
          success: false,
          sql: 'ALTER TABLE "orders" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id")',
          result: { error: 'relation "users" does not exist' },
          id: '1',
          metadata: { executionTime: 0, timestamp: new Date().toISOString() },
        },
      ])
      .mockResolvedValueOnce([
        {
          success: true,
          sql: 'CREATE TABLE "users"',
          result: {},
          id: '1',
          metadata: { executionTime: 0, timestamp: new Date().toISOString() },
        },
        {
          success: true,
          sql: 'CREATE TABLE "orders"',
          result: {},
          id: '2',
          metadata: { executionTime: 0, timestamp: new Date().toISOString() },
        },
        {
          success: true,
          sql: 'ALTER TABLE',
          result: {},
          id: '3',
          metadata: { executionTime: 0, timestamp: new Date().toISOString() },
        },
      ])

    const initialState = {
      userInput: 'Create an orders table that references users',
      formattedHistory: '',
      schemaData: { tables: {} },
      buildingSchemaId: 'test-id',
      latestVersionNumber: 1,
      repositories: {
        schema: {
          updateTimelineItem: vi.fn(),
          createBuildingSchema: vi.fn(),
          getSchema: vi.fn(),
          getDesignSession: vi.fn(),
          createVersion: vi.fn(),
          createTimelineItem: vi.fn(),
          getTimelineItems: vi.fn(),
          updateBuildingSchema: vi.fn(),
          createArtifact: vi.fn(),
          updateArtifact: vi.fn(),
          getArtifact: vi.fn(),
        },
      },
      designSessionId: 'session-id',
      userId: 'user-id',
      logger: {
        log: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
      },
      retryCount: {},
    } as WorkflowState

    // First design attempt
    const state1 = await designSchemaNode(initialState)
    expect(state1.schemaData.tables).toHaveProperty('orders')
    expect(state1.schemaData.tables).not.toHaveProperty('users')

    // First DDL execution - should fail
    const state2 = await executeDdlNode({
      ...state1,
      ddlStatements:
        'CREATE TABLE orders...; ALTER TABLE orders ADD CONSTRAINT...',
    })
    expect(state2.shouldRetryWithDesignSchema).toBe(true)
    expect(state2.ddlExecutionFailureReason).toContain(
      'relation "users" does not exist',
    )

    // Second design attempt with error feedback
    const state3 = await designSchemaNode(state2)
    expect(state3.schemaData.tables).toHaveProperty('users')
    expect(state3.schemaData.tables).toHaveProperty('orders')

    // Second DDL execution - should succeed
    const state4 = await executeDdlNode({
      ...state3,
      ddlStatements:
        'CREATE TABLE users...; CREATE TABLE orders...; ALTER TABLE...',
    })
    expect(state4.shouldRetryWithDesignSchema).toBeUndefined()
    expect(state4.ddlExecutionFailed).toBeUndefined()

    // Verify the error message was passed to schema generation on retry
    const retryCall = mockAgent.generate.mock.calls[1]?.[0] as
      | { user_message: string }
      | undefined
    expect(retryCall?.user_message).toContain('relation "users" does not exist')
  })
})
