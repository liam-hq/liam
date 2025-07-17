import { createSupabaseRepositories, deepModeling } from '@liam-hq/agent'
import type { SupabaseClientType } from '@liam-hq/db'
import { createClient } from '@supabase/supabase-js'
import { err, ok, type Result } from 'neverthrow'
import type {
  LiamDBExecutorConfig,
  LiamDBExecutorInput,
  LiamDBExecutorOutput,
} from './types.ts'

export const createLiamDBExecutor = (config: LiamDBExecutorConfig) => {
  // @ts-expect-error - Type mismatch between Supabase client versions
  const supabase: SupabaseClientType = createClient(
    config.supabaseUrl,
    config.supabaseAnonKey,
  )
  supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'liampassword1234',
  })
  const organizationId = config.organizationId

  const execute = async (
    input: LiamDBExecutorInput,
  ): Promise<Result<LiamDBExecutorOutput, Error>> => {
    try {
      // 1. Create design session
      const sessionResult = await createDesignSession(
        supabase,
        organizationId,
        input.input,
      )
      if (sessionResult.isErr()) {
        return err(sessionResult.error)
      }
      const sessionId = sessionResult.value

      // 2. Run deep modeling directly (without Trigger.dev)
      const processResult = await runDeepModeling(
        supabase,
        organizationId,
        sessionId,
        input.input,
      )
      if (processResult.isErr()) {
        return err(processResult.error)
      }

      // 3. Fetch the generated schema
      const schemaResult = await fetchSchema(supabase, sessionId)
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

  return { execute }
}

const createDesignSession = async (
  supabase: SupabaseClientType,
  organizationId: string,
  initialMessage: string,
): Promise<Result<string, Error>> => {
  try {
    // Create design session
    const { data: session, error: sessionError } = await supabase
      .from('design_sessions')
      .insert({
        organization_id: organizationId,
        name: `Schema Bench Test - ${new Date().toISOString()}`,
        created_by_user_id: '2a57de2e-dd3d-4f9c-8735-29f52910b0fc',
      })
      .select('id')
      .single()

    if (sessionError || !session) {
      return err(
        new Error(`Failed to create design session: ${sessionError?.message}`),
      )
    }

    // Create building schema
    const { error: schemaError } = await supabase
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
    const { error: timelineError } = await supabase
      .from('timeline_items')
      .insert({
        design_session_id: session.id,
        type: 'user' as const,
        content: initialMessage,
        user_id: '2a57de2e-dd3d-4f9c-8735-29f52910b0fc',
        updated_at: new Date().toISOString(),
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

const runDeepModeling = async (
  supabase: SupabaseClientType,
  organizationId: string,
  sessionId: string,
  userInput: string,
): Promise<Result<void, Error>> => {
  try {
    // Create repositories
    const repositories = createSupabaseRepositories(supabase)

    // Get building schema
    const { data: buildingSchema, error: buildingSchemaError } = await supabase
      .from('building_schemas')
      .select('id')
      .eq('design_session_id', sessionId)
      .single()

    if (buildingSchemaError || !buildingSchema) {
      return err(
        new Error(
          `Failed to get building schema: ${buildingSchemaError?.message}`,
        ),
      )
    }

    // Get latest version
    const { data: latestVersion } = await supabase
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
    const deepModelingResult = await deepModeling(
      {
        userInput,
        // @ts-expect-error - Schema type mismatch between packages
        schemaData: schemaResult.data,
        history: [], // Empty history for first message
        organizationId: organizationId,
        buildingSchemaId: buildingSchema.id,
        latestVersionNumber: latestVersion?.number || 0,
        designSessionId: sessionId,
        userId: '44597a5b-cc16-46e2-a98e-6d590f670ae6', // Dummy user ID
        recursionLimit: 20,
      },
      {
        configurable: {
          repositories,
          logger: {
            debug: () => {},
            log: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
          },
        },
      },
    )

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

const fetchSchema = async (
  supabase: SupabaseClientType,
  sessionId: string,
): Promise<Result<LiamDBExecutorOutput, Error>> => {
  const { data, error } = await supabase
    .from('building_schemas')
    .select('schema')
    .eq('design_session_id', sessionId)
    .single()

  if (error || !data) {
    return err(
      new Error(`Failed to fetch schema: ${error?.message || 'No data'}`),
    )
  }

  // @ts-expect-error - Schema type from database
  return ok(data.schema)
}
