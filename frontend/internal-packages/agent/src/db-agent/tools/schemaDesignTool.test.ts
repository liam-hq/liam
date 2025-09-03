import type { RunnableConfig } from '@langchain/core/runnables'
import { executeQuery } from '@liam-hq/pglite-server'
import {
  aColumn,
  aForeignKeyConstraint,
  aSchema,
  aTable,
} from '@liam-hq/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repositories } from '../../repositories'
import { InMemoryRepository } from '../../repositories/InMemoryRepository'
import { schemaDesignTool } from './schemaDesignTool'

vi.mock('@liam-hq/pglite-server', () => ({
  executeQuery: vi.fn(),
}))

describe('schemaDesignTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockConfig = (
    buildingSchemaId: string,
    latestVersionNumber: number,
    designSessionId: string,
    testRepositories: Repositories,
  ): RunnableConfig => ({
    configurable: {
      buildingSchemaId,
      latestVersionNumber,
      designSessionId,
      repositories: testRepositories,
      thread_id: 'test-thread',
      logger: {
        log: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    },
  })

  it('should successfully update schema version with DDL validation', async () => {
    vi.mocked(executeQuery).mockResolvedValue([
      {
        success: true,
        sql: 'CREATE TABLE users (id integer NOT NULL, name varchar(255));',
        result: { rows: [], columns: [] },
        id: 'result-1',
        metadata: {
          executionTime: 1,
          timestamp: new Date().toISOString(),
        },
      },
    ])

    const repositories: Repositories = {
      schema: new InMemoryRepository({
        schemas: {
          'test-session': aSchema(), // Use designSessionId as the key
        },
      }),
    }

    const config = createMockConfig(
      'test-session', // Use same ID for both buildingSchemaId and designSessionId
      1,
      'test-session',
      repositories,
    )
    const input = {
      operations: [
        {
          op: 'add',
          path: '/tables/users',
          value: aTable({
            name: 'users',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'integer',
                notNull: true,
              }),
              name: aColumn({
                name: 'name',
                type: 'varchar(255)',
                notNull: false,
              }),
            },
          }),
        },
      ],
    }

    const result = await schemaDesignTool.invoke(input, config)

    expect(result).toBe(
      'Schema successfully updated. The operations have been applied to the database schema, DDL validation successful (1/1 statements executed successfully), and new version created.',
    )

    // Verify the schema was actually updated in the repository by schemaDesignTool
    const schemaData = await repositories.schema.getSchema('test-session')
    expect(schemaData.isOk()).toBe(true)
    if (schemaData.isOk()) {
      expect(schemaData.value.schema).toEqual(
        aSchema({
          tables: {
            users: aTable({
              name: 'users',
              columns: {
                id: aColumn({
                  name: 'id',
                  type: 'integer',
                  notNull: true,
                }),
                name: aColumn({
                  name: 'name',
                  type: 'varchar(255)',
                  notNull: false,
                }),
              },
            }),
          },
        }),
      )
      expect(schemaData.value.latestVersionNumber).toBe(2)
    }
  }, 15000)

  it('should throw error when update fails', async () => {
    const repositories: Repositories = {
      schema: new InMemoryRepository(),
    }

    const config = createMockConfig(
      'non-existent-schema-id',
      1,
      'test-session',
      repositories,
    )
    const input = {
      operations: [
        {
          op: 'add',
          path: '/tables/users',
          value: aTable({
            name: 'users',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'integer',
                notNull: true,
              }),
            },
          }),
        },
      ],
    }

    await expect(schemaDesignTool.invoke(input, config)).rejects.toThrow(
      'Could not retrieve current schema for DDL validation. Please check the schema ID and try again.',
    )
  })

  it('should handle malformed input', async () => {
    const repositories: Repositories = {
      schema: new InMemoryRepository(),
    }

    const config = createMockConfig(
      'test-schema-id',
      1,
      'test-session',
      repositories,
    )
    const input = {
      operations: 'invalid-operations', // Should be an array
    }

    await expect(schemaDesignTool.invoke(input, config)).rejects.toThrow(
      'Input validation failed',
    )
  })

  it('should handle empty operations array', async () => {
    // Empty schema with empty operations should generate empty DDL
    vi.mocked(executeQuery).mockResolvedValue([])

    const initialSchema = aSchema({ tables: {} })
    const repositories: Repositories = {
      schema: new InMemoryRepository({
        schemas: {
          'test-session': initialSchema, // Use designSessionId as the key
        },
      }),
    }

    const config = createMockConfig(
      'test-session', // Use same ID for both buildingSchemaId and designSessionId
      1,
      'test-session',
      repositories,
    )
    const input = {
      operations: [],
    }

    // With actual PGlite, empty operations on empty schema should succeed
    const result = await schemaDesignTool.invoke(input, config)
    expect(result).toBe(
      'Schema successfully updated. The operations have been applied to the database schema, DDL validation successful (0/0 statements executed successfully), and new version created.',
    )
  })

  // TODO: Re-enable this test after finding a DDL pattern that reliably fails in both local and CI environments
  // The current foreign key constraint to non-existent table passes in CI but fails locally
  it.skip('should throw error when DDL execution fails', async () => {
    const repositories: Repositories = {
      schema: new InMemoryRepository({
        schemas: {
          'test-session': aSchema(), // Use designSessionId as the key
        },
      }),
    }

    const config = createMockConfig(
      'test-session', // Use same ID for both buildingSchemaId and designSessionId
      1,
      'test-session',
      repositories,
    )
    const input = {
      operations: [
        {
          op: 'add',
          path: '/tables/users',
          value: aTable({
            name: 'users',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'integer',
                notNull: true,
              }),
              department_id: aColumn({
                name: 'department_id',
                type: 'integer',
                notNull: true,
              }),
            },
            constraints: {
              fk_department: aForeignKeyConstraint({
                name: 'fk_department',
                columnNames: ['department_id'],
                targetTableName: 'nonexistent_table',
                targetColumnNames: ['id'],
              }),
            },
          }),
        },
      ],
    }

    await expect(schemaDesignTool.invoke(input, config)).rejects.toThrow(
      'DDL execution validation failed:',
    )
  }, 15000)
})
