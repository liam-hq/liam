import type { RunnableConfig } from '@langchain/core/runnables'
import {
  aColumn,
  aForeignKeyConstraint,
  aSchema,
  aTable,
} from '@liam-hq/db-structure'
import { describe, expect, it, vi } from 'vitest'
import type { Repositories } from '../../repositories'
import { InMemoryRepository } from '../../repositories/InMemoryRepository'
import { schemaDesignTool } from './schemaDesignTool'

describe('schemaDesignTool', () => {
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
      'Schema successfully updated. The operations have been applied to the database schema, DDL validation passed, and new version created.',
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

    // LangChain validates schema before our tool function is called
    await expect(schemaDesignTool.invoke(input, config)).rejects.toThrow(
      'Received tool input did not match expected schema',
    )
  })

  it('should handle empty operations array', async () => {
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
      'Schema successfully updated. The operations have been applied to the database schema, DDL validation passed, and new version created.',
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
