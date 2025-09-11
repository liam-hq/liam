import { resolve } from 'node:path'
import { createClient, type SupabaseClientType } from '@liam-hq/db'
import type { Schema } from '@liam-hq/schema'
import { config } from 'dotenv'
import type { Result } from 'neverthrow'
import { err, errAsync, ok, okAsync, ResultAsync } from 'neverthrow'
import { createSupabaseRepositories } from '../../src/repositories/factory'

// Load environment variables from ../../../../../.env and .env.local
config({ path: resolve(__dirname, '../../../../../.env') })
config({ path: resolve(__dirname, '../../../../../.env.local') })

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const

type LogLevel = keyof typeof LOG_LEVELS

// Enhanced logger implementation with configurable log levels
export const createLogger = (logLevel: LogLevel) => ({
  debug: (message: string, metadata?: Record<string, unknown>) => {
    if (LOG_LEVELS[logLevel] > LOG_LEVELS.DEBUG) return

    const timestamp = new Date().toISOString()
    process.stdout.write(`\n🔍 [DEBUG] ${timestamp}\n${message}\n`)
    if (metadata) {
      process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`)
    }
  },
  info: (message: string, metadata?: Record<string, unknown>) => {
    if (LOG_LEVELS[logLevel] > LOG_LEVELS.INFO) return

    const timestamp = new Date().toISOString()
    process.stdout.write(`\n✅ [INFO] ${timestamp}\n${message}\n`)
    if (metadata) {
      process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`)
    }
  },
  warn: (message: string, metadata?: Record<string, unknown>) => {
    if (LOG_LEVELS[logLevel] > LOG_LEVELS.WARN) return

    const timestamp = new Date().toISOString()
    process.stdout.write(`\n⚠️  [WARN] ${timestamp}\n${message}\n`)
    if (metadata) {
      process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`)
    }
  },
  error: (message: string, metadata?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString()
    process.stderr.write(`\n❌ [ERROR] ${timestamp}\n${message}\n`)
    if (metadata) {
      process.stderr.write(`${JSON.stringify(metadata, null, 2)}\n`)
    }
  },
})

/**
 * Validate required environment variables
 */
export const validateEnvironment = (): ResultAsync<void, Error> => {
  if (!process.env['SUPABASE_SERVICE_ROLE_KEY']) {
    return errAsync(
      new Error(
        'SUPABASE_SERVICE_ROLE_KEY is required - please set it in .env file',
      ),
    )
  }
  if (!process.env['NEXT_PUBLIC_SUPABASE_URL']) {
    return errAsync(
      new Error(
        'NEXT_PUBLIC_SUPABASE_URL is required - please set it in .env file',
      ),
    )
  }
  if (!process.env['OPENAI_API_KEY']) {
    return errAsync(
      new Error('OPENAI_API_KEY is required - please set it in .env file'),
    )
  }
  return okAsync(undefined)
}

/**
 * Create Supabase client
 */
const createDatabaseConnection = (): Result<SupabaseClientType, Error> => {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

  if (!supabaseUrl || !supabaseKey) {
    return err(
      new Error(
        'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
      ),
    )
  }
  const supabaseClient = createClient(supabaseUrl, supabaseKey)
  return ok(supabaseClient)
}

/**
 * Get the first organization from database
 */
const getFirstOrganization = async (
  supabaseClient: SupabaseClientType,
): Promise<Result<{ id: string; name: string }, Error>> => {
  const { data: organizations, error } = await supabaseClient
    .from('organizations')
    .select('id, name')
    .limit(1)
    .single()

  if (error || !organizations) {
    return err(
      new Error(
        `Failed to fetch organization: ${error?.message || 'No organizations found'}`,
      ),
    )
  }

  return ok(organizations)
}

/**
 * Get existing user (no creation)
 */
const getUser = async (
  supabaseClient: SupabaseClientType,
): Promise<Result<{ id: string; email: string }, Error>> => {
  // Try to find an existing user
  const { data: existingUser, error: findError } = await supabaseClient
    .from('users')
    .select('id, email')
    .limit(1)
    .single()

  if (existingUser && !findError) {
    return ok(existingUser)
  }

  // Return error if no user exists
  return err(
    new Error(
      `No existing user found: ${findError?.message || 'No users in database'}`,
    ),
  )
}

/**
 * Create design session record
 */
export const createDesignSession = (setupData: SetupDatabaseAndUserResult) => {
  const { supabaseClient, organization, user } = setupData
  const sessionName = `Design Session - ${new Date().toISOString()}`

  return ResultAsync.fromPromise(
    supabaseClient
      .from('design_sessions')
      .insert({
        name: sessionName,
        project_id: null, // No project for this session
        organization_id: organization.id,
        created_by_user_id: user.id,
        parent_design_session_id: null,
      })
      .select()
      .single(),
    (error) => new Error(`Failed to create design session: ${error}`),
  ).andThen(({ data: designSession, error: insertError }) => {
    if (insertError || !designSession) {
      return errAsync(
        new Error(`Failed to create design session: ${insertError?.message}`),
      )
    }
    return okAsync({
      ...setupData,
      designSession,
    })
  })
}

/**
 * Create building schema record
 */
export const createBuildingSchema = (
  sessionData: SetupDatabaseAndUserResult & {
    designSession: { id: string; name: string }
  },
) => {
  const { supabaseClient, organization, designSession } = sessionData
  const initialSchema: Schema = { tables: {}, enums: {}, extensions: {} }

  return ResultAsync.fromPromise(
    supabaseClient
      .from('building_schemas')
      .insert({
        design_session_id: designSession.id,
        organization_id: organization.id,
        schema: structuredClone(initialSchema),
        initial_schema_snapshot: structuredClone(initialSchema),
        schema_file_path: null,
        git_sha: null,
      })
      .select()
      .single(),
    (error) => new Error(`Failed to create building schema: ${error}`),
  ).andThen(({ data: buildingSchema, error: buildingSchemaError }) => {
    if (buildingSchemaError || !buildingSchema) {
      return errAsync(
        new Error(
          `Failed to create building schema: ${buildingSchemaError?.message}`,
        ),
      )
    }
    return okAsync({
      ...sessionData,
      buildingSchema: {
        id: buildingSchema.id,
        latest_version_number: 0,
      },
    })
  })
}

type SupabaseRepositories = ReturnType<typeof createSupabaseRepositories>

export type SetupDatabaseAndUserResult = {
  supabaseClient: SupabaseClientType
  repositories: SupabaseRepositories
  organization: { id: string; name: string }
  user: { id: string; email: string }
}

/**
 * Setup database connections and user data
 */
export const setupDatabaseAndUser =
  (logger: ReturnType<typeof createLogger>) =>
  (): ResultAsync<SetupDatabaseAndUserResult, Error> => {
    const connectionResult = createDatabaseConnection()
    if (connectionResult.isErr()) {
      return errAsync(connectionResult.error)
    }
    const supabaseClient = connectionResult.value

    logger.debug('Setting up database connections and user data')

    const getOrganizationAsync = ResultAsync.fromPromise(
      getFirstOrganization(supabaseClient),
      (error) => (error instanceof Error ? error : new Error(String(error))),
    )

    const getUserAsync = ResultAsync.fromPromise(
      getUser(supabaseClient),
      (error) => (error instanceof Error ? error : new Error(String(error))),
    )

    return getOrganizationAsync.andThen((organizationResult) => {
      if (organizationResult.isErr()) {
        return errAsync(organizationResult.error)
      }
      const organization = organizationResult.value
      logger.debug('Found organization:', {
        id: organization.id,
        name: organization.name,
      })

      return getUserAsync.andThen((userResult) => {
        if (userResult.isErr()) {
          return errAsync(userResult.error)
        }
        const user = userResult.value
        logger.debug('Found user:', { id: user.id, email: user.email })

        const repositories = createSupabaseRepositories(
          supabaseClient,
          organization.id,
        )

        return okAsync({
          supabaseClient,
          repositories,
          organization,
          user,
        })
      })
    })
  }
