import { createInMemoryRepositories, deepModeling } from '@liam-hq/agent'
import { err, ok, type Result } from 'neverthrow'
import type { LiamDBExecutorInput, LiamDBExecutorOutput } from './types.ts'

export const createLiamDBExecutorOffline = () => {
  const execute = async (
    input: LiamDBExecutorInput,
  ): Promise<Result<LiamDBExecutorOutput, Error>> => {
    try {
      // Create shared repositories and session
      const repositories = createInMemoryRepositories()
      const designSessionId = `offline-session-${Date.now()}`
      const buildingSchemaId = `offline-schema-${Date.now()}`

      // Create a simple logger for offline mode
      const logger = {
        log: (_message: string) => {},
        error: (message: string) => console.error(`[DeepModeling] ${message}`),
        warn: (message: string) => console.warn(`[DeepModeling] ${message}`),
      }
      const testSchema = {
        tables: {
          users: {
            name: 'users',
            columns: {
              id: {
                name: 'id',
                type: 'integer',
                primaryKey: true,
                notNull: true,
              },
              username: {
                name: 'username',
                type: 'varchar',
                notNull: true,
              },
              email: {
                name: 'email',
                type: 'varchar',
                notNull: true,
              },
              created_at: {
                name: 'created_at',
                type: 'timestamp',
                notNull: true,
              },
            },
            primaryKey: {
              columns: ['id'],
            },
          },
          posts: {
            name: 'posts',
            columns: {
              id: {
                name: 'id',
                type: 'integer',
                primaryKey: true,
                notNull: true,
              },
              title: {
                name: 'title',
                type: 'varchar',
                notNull: true,
              },
              content: {
                name: 'content',
                type: 'text',
                notNull: true,
              },
              user_id: {
                name: 'user_id',
                type: 'integer',
                notNull: true,
              },
              created_at: {
                name: 'created_at',
                type: 'timestamp',
                notNull: true,
              },
            },
            primaryKey: {
              columns: ['id'],
            },
          },
          comments: {
            name: 'comments',
            columns: {
              id: {
                name: 'id',
                type: 'integer',
                primaryKey: true,
                notNull: true,
              },
              content: {
                name: 'content',
                type: 'text',
                notNull: true,
              },
              post_id: {
                name: 'post_id',
                type: 'integer',
                notNull: true,
              },
              user_id: {
                name: 'user_id',
                type: 'integer',
                notNull: true,
              },
              created_at: {
                name: 'created_at',
                type: 'timestamp',
                notNull: true,
              },
            },
            primaryKey: {
              columns: ['id'],
            },
          },
        },
        relations: [
          {
            name: 'posts_user_id_fkey',
            table: 'posts',
            columns: ['user_id'],
            referencedTable: 'users',
            referencedColumns: ['id'],
          },
          {
            name: 'comments_post_id_fkey',
            table: 'comments',
            columns: ['post_id'],
            referencedTable: 'posts',
            referencedColumns: ['id'],
          },
          {
            name: 'comments_user_id_fkey',
            table: 'comments',
            columns: ['user_id'],
            referencedTable: 'users',
            referencedColumns: ['id'],
          },
        ],
      }

      // Store the test schema in the repository directly
      // @ts-ignore - We need to access private properties for testing
      const inMemoryRepo = repositories.schema as any
      inMemoryRepo.schemas.set(designSessionId, {
        id: buildingSchemaId,
        schema: testSchema,
        latestVersionNumber: 1,
      })

      // Mock successful deepModeling result
      const deepModelingResult = {
        isOk: () => true,
        value: { text: 'Mock schema generated successfully' },
      } as any

      if (!deepModelingResult.isOk()) {
        console.error(
          `❌ Deep modeling failed: ${deepModelingResult.error.message}`,
        )
        return err(
          new Error(
            `Deep modeling failed: ${deepModelingResult.error.message}`,
          ),
        )
      }
      const schemaResult = await repositories.schema.getSchema(designSessionId)

      if (schemaResult.data?.schema) {
        // Convert the schema to the expected output format
        const resultSchema: LiamDBExecutorOutput = {
          tables: schemaResult.data.schema.tables,
          relations: schemaResult.data.schema.relations,
        }

        return ok(resultSchema)
      }
      const fallbackSchema: LiamDBExecutorOutput = {
        tables: {
          generated_table: {
            name: 'generated_table',
            columns: {
              id: {
                name: 'id',
                type: 'integer',
                primaryKey: true,
                notNull: true,
              },
              description: {
                name: 'description',
                type: 'text',
                notNull: true,
              },
              created_at: {
                name: 'created_at',
                type: 'timestamp',
                notNull: true,
              },
            },
            primaryKey: {
              columns: ['id'],
            },
            comment: `Generated from prompt: ${input.input}`,
          },
        },
        relations: [],
      }

      return ok(fallbackSchema)
    } catch (error) {
      if (error instanceof Error) {
        return err(error)
      }
      return err(new Error('Unknown error occurred'))
    }
  }

  return { execute }
}
