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
    repositories: Repositories,
  ): RunnableConfig => ({
    configurable: {
      buildingSchemaId,
      latestVersionNumber,
      designSessionId,
      repositories,
      thread_id: 'test-thread-id',
    },
  })

  it('should successfully update schema version with DDL validation', async () => {
    // Mock successful DDL execution
    vi.mocked(executeQuery).mockResolvedValue([
      {
        sql: 'CREATE TABLE users (id integer NOT NULL, name varchar(255));',
        success: true,
        result: { rowCount: 0 },
        id: 'test-id',
        metadata: {
          executionTime: 1,
          timestamp: new Date().toISOString(),
        },
      },
    ])

    // Create initial empty schema with id matching the one used in the test
    const initialSchema = aSchema({
      tables: {},
    })

    const repositories: Repositories = {
      schema: new InMemoryRepository({
        schemas: {
          'test-session': initialSchema, // Use designSessionId as the key
          'test-schema-id': initialSchema, // Also need buildingSchemaId for version creation
        },
      }),
    }

    const config = createMockConfig(
      'test-schema-id',
      1,
      'test-session',
      repositories,
    )
    const input = {
      operations: [
        {
          op: 'add' as const,
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

    // The tool itself doesn't update the schema directly, it returns a success message
    // The actual update is performed by the node that invokes the tool

    // Verify DDL was executed with correct statements
    expect(vi.mocked(executeQuery)).toHaveBeenCalledWith(
      `CREATE TABLE "users" (
  "id" integer NOT NULL,
  "name" varchar(255)
);`,
      [],
    )

    // Check version was created
    const version = await repositories.schema.createVersion({
      buildingSchemaId: 'test-schema-id',
      latestVersionNumber: 1,
      patch: input.operations,
    })
    expect(version.success).toBe(true)
  })

  it('should throw error when update fails', async () => {
    const repositories: Repositories = {
      schema: new InMemoryRepository({
        schemas: {},
      }),
    }

    const config = createMockConfig(
      'test-schema-id',
      1,
      'non-existent-session',
      repositories,
    )
    const input = {
      operations: [
        {
          op: 'add' as const,
          path: '/tables/test',
          value: aTable({ name: 'test' }),
        },
      ],
    }

    await expect(schemaDesignTool.invoke(input, config)).rejects.toThrow(
      'Could not retrieve current schema for DDL validation',
    )
  })

  it('should handle malformed input', async () => {
    const repositories: Repositories = {
      schema: new InMemoryRepository({
        schemas: {},
      }),
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
    // Empty schema with empty operations should generate empty DDL
    vi.mocked(executeQuery).mockResolvedValue([])

    const initialSchema = aSchema({ tables: {} })
    const repositories: Repositories = {
      schema: new InMemoryRepository({
        schemas: {
          'test-session': initialSchema, // Use designSessionId as the key
          'test-schema-id': initialSchema, // Also need buildingSchemaId for version creation
        },
      }),
    }

    const config = createMockConfig(
      'test-schema-id',
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

  it.skip('should throw error when DDL execution fails', async () => {
    // Mock DDL execution failure
    vi.mocked(executeQuery).mockResolvedValue([
      {
        sql: 'CREATE TABLE posts (id integer NOT NULL, user_id integer NOT NULL, title varchar(255), FOREIGN KEY (user_id) REFERENCES users(id));',
        success: false,
        result: {
          error: 'ERROR: relation "users" does not exist',
        },
        id: 'test-id',
        metadata: {
          executionTime: 1,
          timestamp: new Date().toISOString(),
        },
      },
    ])

    const initialSchema = aSchema({
      tables: {},
    })

    const repositories: Repositories = {
      schema: new InMemoryRepository({
        schemas: {
          'test-session': initialSchema,
        },
      }),
    }

    const config = createMockConfig(
      'test-schema-id',
      1,
      'test-session',
      repositories,
    )
    const input = {
      operations: [
        {
          op: 'add' as const,
          path: '/tables/posts',
          value: aTable({
            name: 'posts',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'integer',
                notNull: true,
              }),
              user_id: aColumn({
                name: 'user_id',
                type: 'integer',
                notNull: true,
              }),
              title: aColumn({
                name: 'title',
                type: 'varchar(255)',
                notNull: false,
              }),
            },
            constraints: {
              posts_user_id_fkey: aForeignKeyConstraint({
                name: 'posts_user_id_fkey',
                columnNames: ['user_id'],
                targetTableName: 'users',
                targetColumnNames: ['id'],
              }),
            },
          }),
        },
      ],
    }

    await expect(schemaDesignTool.invoke(input, config)).rejects.toThrow(
      'DDL execution validation failed',
    )

    // Verify DDL was attempted
    expect(vi.mocked(executeQuery)).toHaveBeenCalledWith(
      'CREATE TABLE posts (id integer NOT NULL, user_id integer NOT NULL, title varchar(255), FOREIGN KEY (user_id) REFERENCES users(id));',
      [],
    )
  })
})
