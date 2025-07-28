import type { RunnableConfig } from '@langchain/core/runnables'
import { aColumn, aSchema, aTable } from '@liam-hq/db-structure'
import { describe, expect, it, vi } from 'vitest'
import type { Repositories } from '../../repositories'
import { InMemoryRepository } from '../../repositories/InMemoryRepository'
import { schemaDesignTool } from './schemaDesignTool'

describe('schemaDesignTool', () => {
  const createMockConfig = (
    buildingSchemaId: string,
    latestVersionNumber: number,
    testRepositories: Repositories,
  ): RunnableConfig => ({
    configurable: {
      buildingSchemaId,
      latestVersionNumber,
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

  it('should successfully update schema version', async () => {
    const repositories: Repositories = {
      schema: new InMemoryRepository({
        schemas: {
          'test-schema': aSchema(),
        },
      }),
    }

    const config = createMockConfig('test-schema', 1, repositories)
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
      'Schema successfully updated. The operations have been applied to the database schema.',
    )

    // Verify the schema was actually updated in the repository by schemaDesignTool
    const schemaResult = await repositories.schema.getSchema('test-schema')
    expect(schemaResult.isOk()).toBe(true)
    if (schemaResult.isOk()) {
      expect(schemaResult.value.schema).toEqual(
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
      expect(schemaResult.value.latestVersionNumber).toBe(2)
    }
  })

  it('should throw error when update fails', async () => {
    const repositories: Repositories = {
      schema: new InMemoryRepository(),
    }

    const config = createMockConfig('non-existent-schema-id', 1, repositories)
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
      'Schema update failed: Building schema not found. Please fix the error and try again.',
    )
  })

  it('should handle malformed input', async () => {
    const repositories: Repositories = {
      schema: new InMemoryRepository(),
    }

    const config = createMockConfig('test-schema-id', 1, repositories)
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
          'test-schema': initialSchema,
        },
      }),
    }

    const config = createMockConfig('test-schema', 1, repositories)
    const input = {
      operations: [],
    }

    const result = await schemaDesignTool.invoke(input, config)

    expect(result).toBe(
      'Schema successfully updated. The operations have been applied to the database schema.',
    )
  })
})
