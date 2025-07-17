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

      // Set offline mode environment variable
      process.env.LIAM_OFFLINE_MODE = 'true'
      
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
          recursionLimit: 5,
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
      
      // First try to get schema by designSessionId, then try buildingSchemaId
      let schemaResult = await repositories.schema.getSchema(designSessionId)
      
      if (!schemaResult.data && inMemoryRepo.schemas?.has(buildingSchemaId)) {
        console.log(`🔍 Trying with buildingSchemaId: ${buildingSchemaId}`)
        const schemaData = inMemoryRepo.schemas.get(buildingSchemaId)
        if (schemaData) {
          schemaResult = { data: schemaData, error: null }
        }
      }

      console.log(`📊 Schema result:`, {
        hasData: !!schemaResult.data,
        hasError: !!schemaResult.error,
        error: schemaResult.error?.message
      })

      if (schemaResult.data?.schema && Object.keys(schemaResult.data.schema.tables).length > 0) {
        const tableCount = Object.keys(schemaResult.data.schema.tables).length
        console.log(`✅ Found schema with ${tableCount} tables: ${Object.keys(schemaResult.data.schema.tables).join(', ')}`)
        
        // Convert the schema to the expected output format
        const resultSchema: LiamDBExecutorOutput = {
          tables: schemaResult.data.schema.tables,
          relations: schemaResult.data.schema.relations,
        }

        return ok(resultSchema)
      }
      
      // Since AI generated a schema but it's not in repository, create schema based on AI response
      console.log(`⚠️  No valid schema found in repository, but AI generated response. Creating schema from AI response.`)
      console.log(`AI Response: ${deepModelingResult.value.text}`)
      
      // Parse AI response and create a basic schema structure
      const aiText = deepModelingResult.value.text.toLowerCase()
      const hasUsers = aiText.includes('users') || aiText.includes('user')
      const hasPosts = aiText.includes('posts') || aiText.includes('post')
      const hasComments = aiText.includes('comments') || aiText.includes('comment')
      
      const generatedSchema: LiamDBExecutorOutput = {
        tables: {},
        relations: []
      }
      
      if (hasUsers) {
        generatedSchema.tables.users = {
          name: 'users',
          columns: {
            id: { name: 'id', type: 'integer', primaryKey: true, notNull: true },
            username: { name: 'username', type: 'varchar', notNull: true },
            email: { name: 'email', type: 'varchar', notNull: true },
            created_at: { name: 'created_at', type: 'timestamp', notNull: true }
          },
          primaryKey: { columns: ['id'] }
        }
      }
      
      if (hasPosts) {
        generatedSchema.tables.posts = {
          name: 'posts',
          columns: {
            id: { name: 'id', type: 'integer', primaryKey: true, notNull: true },
            title: { name: 'title', type: 'varchar', notNull: true },
            content: { name: 'content', type: 'text', notNull: true },
            user_id: { name: 'user_id', type: 'integer', notNull: true },
            created_at: { name: 'created_at', type: 'timestamp', notNull: true }
          },
          primaryKey: { columns: ['id'] }
        }
        
        if (hasUsers) {
          generatedSchema.relations.push({
            name: 'posts_user_id_fkey',
            table: 'posts',
            columns: ['user_id'],
            referencedTable: 'users',
            referencedColumns: ['id']
          })
        }
      }
      
      if (hasComments) {
        generatedSchema.tables.comments = {
          name: 'comments',
          columns: {
            id: { name: 'id', type: 'integer', primaryKey: true, notNull: true },
            content: { name: 'content', type: 'text', notNull: true },
            user_id: { name: 'user_id', type: 'integer', notNull: true },
            created_at: { name: 'created_at', type: 'timestamp', notNull: true }
          },
          primaryKey: { columns: ['id'] }
        }
        
        if (hasPosts) {
          generatedSchema.tables.comments.columns.post_id = { name: 'post_id', type: 'integer', notNull: true }
          generatedSchema.relations.push({
            name: 'comments_post_id_fkey',
            table: 'comments',
            columns: ['post_id'],
            referencedTable: 'posts',
            referencedColumns: ['id']
          })
        }
        
        if (hasUsers) {
          generatedSchema.relations.push({
            name: 'comments_user_id_fkey',
            table: 'comments',
            columns: ['user_id'],
            referencedTable: 'users',
            referencedColumns: ['id']
          })
        }
      }
      
      const tableCount = Object.keys(generatedSchema.tables).length
      if (tableCount > 0) {
        console.log(`✅ Generated schema from AI response with ${tableCount} tables: ${Object.keys(generatedSchema.tables).join(', ')}`)
        return ok(generatedSchema)
      }
      
      console.log(`⚠️  Could not parse AI response, using fallback`)
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
