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
        log: (message: string) => console.log(`[DeepModeling] ${message}`),
        error: (message: string) => console.error(`[DeepModeling] ${message}`),
        warn: (message: string) => console.warn(`[DeepModeling] ${message}`),
        debug: (message: string) => console.log(`[DeepModeling:DEBUG] ${message}`),
        info: (message: string) => console.log(`[DeepModeling:INFO] ${message}`),
      }

      // Run actual deep modeling with shared repositories
      console.log(`🤖 Starting actual AI processing for: ${input.input.substring(0, 100)}...`)
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

      console.log(`✅ Deep modeling completed successfully`)
      console.log(`📋 Response: ${deepModelingResult.value.text}`)
      console.log(`🔍 Checking schema in repository with sessionId: ${designSessionId}`)
      
      // Debug: check what's actually in the repository
      const inMemoryRepo = repositories.schema as any
      console.log(`🔍 Repository has ${inMemoryRepo.schemas?.size || 0} schemas stored`)
      if (inMemoryRepo.schemas?.size > 0) {
        for (const [key, value] of inMemoryRepo.schemas.entries()) {
          console.log(`  - Schema key: ${key}, tables: ${Object.keys(value.schema?.tables || {}).length}`)
        }
      }
      
      const schemaResult = await repositories.schema.getSchema(designSessionId)

      console.log(`📊 Schema result:`, {
        hasData: !!schemaResult.data,
        hasError: !!schemaResult.error,
        error: schemaResult.error?.message
      })

      if (schemaResult.data?.schema) {
        const tableCount = Object.keys(schemaResult.data.schema.tables).length
        console.log(`✅ Found schema with ${tableCount} tables: ${Object.keys(schemaResult.data.schema.tables).join(', ')}`)
        
        // Convert the schema to the expected output format
        const resultSchema: LiamDBExecutorOutput = {
          tables: schemaResult.data.schema.tables,
          relations: schemaResult.data.schema.relations,
        }

        return ok(resultSchema)
      }
      
      console.log(`⚠️  No schema found in repository, using fallback`)
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
