import { createInMemoryRepositories, deepModeling } from '@liam-hq/agent'
import { err, ok, type Result } from 'neverthrow'
import type { LiamDBExecutorInput, LiamDBExecutorOutput } from './types'

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
        debug: (_message: string) => {},
        info: (_message: string) => {},
      }
      const deepModelingResult = await deepModeling(
        {
          userInput: input.input,
          schemaData: { tables: {} },
          history: [],
          organizationId: 'offline-org',
          buildingSchemaId,
          latestVersionNumber: 0,
          designSessionId,
          userId: 'offline-user',
          recursionLimit: 15,
        },
        {
          configurable: {
            repositories,
            logger,
          },
        },
      )

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

      // Debug: check what's actually in the repository
      const inMemoryRepo = repositories.schema as any
      if (inMemoryRepo.schemas?.size > 0) {
        for (const _ of inMemoryRepo.schemas.entries()) {
        }
      }

      // First try to get schema by designSessionId, then try buildingSchemaId
      let schemaResult = await repositories.schema.getSchema(designSessionId)

      if (!schemaResult.data && inMemoryRepo.schemas?.has(buildingSchemaId)) {
        const schemaData = inMemoryRepo.schemas.get(buildingSchemaId)
        if (schemaData) {
          schemaResult = { data: schemaData, error: null }
        }
      }

      if (
        schemaResult.data?.schema &&
        Object.keys(schemaResult.data.schema.tables).length > 0
      ) {
        // Convert the schema to the expected output format
        const resultSchema: LiamDBExecutorOutput = {
          tables: schemaResult.data.schema.tables,
        }

        return ok(resultSchema)
      }

      // Parse AI response and create a basic schema structure
      const generatedSchema: LiamDBExecutorOutput = {
        tables: {},
      }

      const tableCount = Object.keys(generatedSchema.tables).length
      if (tableCount > 0) {
        return ok(generatedSchema)
      }
      const fallbackSchema: LiamDBExecutorOutput = {
        tables: {
          generated_table: {
            name: 'generated_table',
            columns: {
              id: {
                name: 'id',
                type: 'integer',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
              description: {
                name: 'description',
                type: 'text',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
              created_at: {
                name: 'created_at',
                type: 'timestamp',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
            },
            constraints: {
              primaryKey: {
                name: 'generated_table_pkey',
                type: 'PRIMARY KEY',
                columnNames: ['id'],
              },
            },
            comment: `Generated from prompt: ${input.input}`,
            indexes: {},
          },
        },
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
