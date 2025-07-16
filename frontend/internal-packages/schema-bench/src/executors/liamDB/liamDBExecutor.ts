import { createSupabaseRepositories, deepModeling } from '@liam-hq/agent'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { err, ok, type Result } from 'neverthrow'
import type {
  LiamDBExecutorConfig,
  LiamDBExecutorInput,
  LiamDBExecutorOutput,
} from './types.ts'

export class LiamDBExecutor {
  private supabase: SupabaseClient
  private organizationId: string
  private timeout: number

  constructor(config: LiamDBExecutorConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey)
    this.organizationId = config.organizationId
    this.timeout = config.timeout || 120000 // 2 minutes default
  }

  async execute(
    input: LiamDBExecutorInput,
  ): Promise<Result<LiamDBExecutorOutput, Error>> {
    try {
      // 1. Create design session
      const sessionResult = await this.createDesignSession(input.prompt)
      if (sessionResult.isErr()) {
        return err(sessionResult.error)
      }
      const sessionId = sessionResult.value

      // 2. Run deep modeling directly (without Trigger.dev)
      const processResult = await this.runDeepModeling(sessionId, input.prompt)
      if (processResult.isErr()) {
        return err(processResult.error)
      }

      // 3. Fetch the generated schema
      const schemaResult = await this.fetchSchema(sessionId)
      if (schemaResult.isErr()) {
        return err(schemaResult.error)
      }

      return ok(schemaResult.value)
    } catch (error) {
      if (error instanceof Error) {
        return err(error)
      }
      return err(new Error('Unknown error occurred'))
    }
  }

  private async createDesignSession(
    initialMessage: string,
  ): Promise<Result<string, Error>> {
    try {
      // Create design session
      const { data: session, error: sessionError } = await this.supabase
        .from('design_sessions')
        .insert({
          organization_id: this.organizationId,
          name: `Schema Bench Test - ${new Date().toISOString()}`,
        })
        .select('id')
        .single()

      if (sessionError || !session) {
        return err(
          new Error(`Failed to create design session: ${sessionError?.message}`),
        )
      }

      // Create building schema
      const { error: schemaError } = await this.supabase
        .from('building_schemas')
        .insert({
          design_session_id: session.id,
          schema: { tables: {} },
          initial_schema_snapshot: { tables: {} },
        })

      if (schemaError) {
        return err(
          new Error(`Failed to create building schema: ${schemaError.message}`),
        )
      }

      // Create initial timeline item (user message)
      const { error: timelineError } = await this.supabase
        .from('timeline_items')
        .insert({
          design_session_id: session.id,
          type: 'user_message',
          user_message: initialMessage,
          order: 0,
        })

      if (timelineError) {
        return err(
          new Error(`Failed to create timeline item: ${timelineError.message}`),
        )
      }

      return ok(session.id)
    } catch (error) {
      if (error instanceof Error) {
        return err(error)
      }
      return err(new Error('Failed to create design session'))
    }
  }

  private async runDeepModeling(
    sessionId: string,
    userInput: string,
  ): Promise<Result<void, Error>> {
    try {
      // Create repositories
      const repositories = createSupabaseRepositories(this.supabase)

      // Get building schema
      const { data: buildingSchema, error: buildingSchemaError } =
        await this.supabase
          .from('building_schemas')
          .select('id')
          .eq('design_session_id', sessionId)
          .single()

      if (buildingSchemaError || !buildingSchema) {
        return err(
          new Error(`Failed to get building schema: ${buildingSchemaError?.message}`),
        )
      }

      // Get latest version
      const { data: latestVersion } = await this.supabase
        .from('building_schema_versions')
        .select('number')
        .eq('building_schema_id', buildingSchema.id)
        .order('number', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Get schema data
      const schemaResult = await repositories.schema.getSchema(sessionId)
      if (schemaResult.error || !schemaResult.data) {
        return err(
          new Error(`Failed to fetch schema data: ${schemaResult.error}`),
        )
      }

      // Run deep modeling
      const deepModelingResult = await deepModeling({
        userInput,
        schemaData: schemaResult.data,
        history: [], // Empty history for first message
        organizationId: this.organizationId,
        buildingSchemaId: buildingSchema.id,
        latestVersionNumber: latestVersion?.number || 0,
        designSessionId: sessionId,
        userId: 'schema-bench-executor', // Dummy user ID
        recursionLimit: 20,
      })

      if (!deepModelingResult.isOk()) {
        return err(
          new Error(`Deep modeling failed: ${deepModelingResult.error.message}`),
        )
      }

      return ok(undefined)
    } catch (error) {
      if (error instanceof Error) {
        return err(error)
      }
      return err(new Error('Failed to run deep modeling'))
    }
  }

  private async fetchSchema(
    sessionId: string,
  ): Promise<Result<LiamDBExecutorOutput, Error>> {
    const { data, error } = await this.supabase
      .from('building_schemas')
      .select('schema')
      .eq('design_session_id', sessionId)
      .single()

    if (error || !data) {
      return err(
        new Error(`Failed to fetch schema: ${error?.message || 'No data'}`),
      )
    }

    return ok(data.schema as LiamDBExecutorOutput)
  }
}