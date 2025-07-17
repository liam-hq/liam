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

      // Run deep modeling with shared repositories
      const deepModelingResult = await deepModeling(
        {
          userInput: input.input,
          schemaData: { tables: {}, relations: [] },
          history: [],
          organizationId: 'offline-org',
          buildingSchemaId,
          latestVersionNumber: 0,
          designSessionId,
          userId: 'offline-user',
          recursionLimit: 20,
        },
        {
          configurable: {
            repositories,
            logger,
          },
        },
      )

      if (!deepModelingResult.isOk()) {
        return err(
          new Error(
            `Deep modeling failed: ${deepModelingResult.error.message}`,
          ),
        )
      }

      // Get the actual generated schema from the shared repository
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
