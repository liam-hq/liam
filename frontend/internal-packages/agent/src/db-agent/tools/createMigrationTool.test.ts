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
import { createMigrationTool } from './createMigrationTool'

type ToolCall = {
  id: string
  name: string
  args: Record<string, unknown>
}

vi.mock('@liam-hq/pglite-server', () => ({
  executeQuery: vi.fn(),
}))

describe('createMigrationTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockConfig = (
    buildingSchemaId: string,
    designSessionId: string,
    repositories: Repositories,
  ): RunnableConfig & {
    toolCall: ToolCall
  } => ({
    configurable: {
      buildingSchemaId,
      designSessionId,
      repositories,
      thread_id: 'test-thread-id',
    },
    toolCall: {
      id: 'test-tool-call-id',
      name: 'createMigrationTool',
      args: {},
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

    // Add spy for createVersion to verify it's called with correct args
    const createVersionSpy = vi.spyOn(repositories.schema, 'createVersion')

    const config = createMockConfig(
      'test-schema-id',
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

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const result = await createMigrationTool.invoke(input, config as never)

    // Tool returns a ToolMessage with the success message
    expect(result).toMatchObject({
      content:
        'Schema successfully updated. The operations have been applied to the database schema, DDL validation successful (1/1 statements executed successfully), and new version created.',
      name: 'createMigrationTool',
      tool_call_id: 'test-tool-call-id',
      status: 'success',
    })

    // Verify DDL was executed with correct statements
    expect(vi.mocked(executeQuery)).toHaveBeenCalledWith(
      `CREATE TABLE "users" (
  "id" integer NOT NULL,
  "name" varchar(255)
);`,
      [],
    )

    // Verify createVersion was called with correct arguments
    expect(createVersionSpy).toHaveBeenCalledWith({
      buildingSchemaId: 'test-session',
      latestVersionNumber: 1,
      patch: input.operations,
    })

    // Verify createVersion was called once
    expect(createVersionSpy).toHaveBeenCalledTimes(1)
  })

  it('should throw error when update fails', async () => {
    const repositories: Repositories = {
      schema: new InMemoryRepository({
        schemas: {},
      }),
    }

    const config = createMockConfig(
      'test-schema-id',
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

    await expect(createMigrationTool.invoke(input, config)).rejects.toThrow(
      /Could not retrieve current schema for DDL validation/,
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
      'test-session',
      repositories,
    )
    const input = {
      operations: 'invalid-operations', // Should be an array
    }

    // LangChain validates schema before our tool function is called
    await expect(createMigrationTool.invoke(input, config)).rejects.toThrow(
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
      'test-session',
      repositories,
    )
    const input = {
      operations: [],
    }

    // With actual PGlite, empty operations on empty schema should succeed
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const result2 = await createMigrationTool.invoke(input, config as never)
    // Tool returns a ToolMessage with the success message
    expect(result2).toMatchObject({
      content:
        'Schema successfully updated. The operations have been applied to the database schema, DDL validation successful (0/0 statements executed successfully), and new version created.',
      name: 'createMigrationTool',
      tool_call_id: 'test-tool-call-id',
      status: 'success',
    })
  })

  it('should throw error when DDL execution fails', async () => {
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
          'test-schema-id': initialSchema, // Also need buildingSchemaId for version creation
        },
      }),
    }

    // Add spy before invoking the tool
    const createVersionSpy = vi.spyOn(repositories.schema, 'createVersion')

    const config = createMockConfig(
      'test-schema-id',
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

    await expect(createMigrationTool.invoke(input, config)).rejects.toThrow(
      /DDL execution validation failed/,
    )

    // Verify DDL was attempted
    expect(vi.mocked(executeQuery)).toHaveBeenCalledWith(
      `CREATE TABLE "posts" (
  "id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "title" varchar(255)
);

ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;`,
      [],
    )

    // Verify createVersion was NOT called due to DDL failure
    expect(createVersionSpy).not.toHaveBeenCalled()
  })

  it('should throw error when createVersion fails', async () => {
    // Mock successful DDL execution
    vi.mocked(executeQuery).mockResolvedValue([
      {
        sql: 'CREATE TABLE users (id integer NOT NULL);',
        success: true,
        result: { rowCount: 0 },
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
          'test-schema-id': initialSchema,
        },
      }),
    }

    // Mock createVersion to fail
    vi.spyOn(repositories.schema, 'createVersion').mockResolvedValue({
      success: false,
      error: 'Version creation failed due to conflict',
    })

    const config = createMockConfig(
      'test-schema-id',
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
            },
          }),
        },
      ],
    }

    await expect(createMigrationTool.invoke(input, config)).rejects.toThrow(
      /Failed to create schema version after DDL validation: Version creation failed due to conflict/,
    )

    // Verify DDL was executed successfully before version creation failed
    expect(vi.mocked(executeQuery)).toHaveBeenCalled()
  })
})
