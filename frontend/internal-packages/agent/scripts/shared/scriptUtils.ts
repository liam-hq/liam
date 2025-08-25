import { resolve } from 'node:path'
import { createClient, type SupabaseClientType } from '@liam-hq/db'
import type { Schema } from '@liam-hq/schema'
import { config } from 'dotenv'
import type { Result } from 'neverthrow'
import { err, errAsync, ok, okAsync, ResultAsync } from 'neverthrow'
import { createSupabaseRepositories } from '../../src/repositories/factory'

// Load environment variables from ../../../../../.env
config({ path: resolve(__dirname, '../../../../../.env') })

// Type guards for safe property access
export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const hasProperty = <T extends string>(
  obj: Record<string, unknown>,
  prop: T,
): obj is Record<T, unknown> & Record<string, unknown> => prop in obj

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const

type LogLevel = keyof typeof LOG_LEVELS

// Get log level from command line arguments or environment
export const getLogLevel = (): LogLevel => {
  const args = process.argv.slice(2)
  const logLevelArg = args
    .find((arg) => arg.startsWith('--log-level='))
    ?.split('=')[1]
  const envLogLevel = process.env['LOG_LEVEL']

  const level = (logLevelArg || envLogLevel || 'INFO').toUpperCase()

  if (
    level === 'DEBUG' ||
    level === 'INFO' ||
    level === 'WARN' ||
    level === 'ERROR'
  ) {
    return level
  }

  console.warn(`Invalid log level: ${level}. Using INFO instead.`)
  return 'INFO'
}

// Enhanced logger implementation with configurable log levels
export const createLogger = (logLevel: LogLevel) => ({
  debug: (message: string, metadata?: Record<string, unknown>) => {
    if (LOG_LEVELS[logLevel] > LOG_LEVELS.DEBUG) return

    const timestamp = new Date().toISOString()
    process.stdout.write(`\n🔍 [DEBUG] ${timestamp} ${message}\n`)
    if (metadata) {
      process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`)
    }
  },
  info: (message: string, metadata?: Record<string, unknown>) => {
    if (LOG_LEVELS[logLevel] > LOG_LEVELS.INFO) return

    const timestamp = new Date().toISOString()
    process.stdout.write(`\n✅ [INFO] ${timestamp} ${message}\n`)
    if (metadata) {
      process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`)
    }
  },
  warn: (message: string, metadata?: Record<string, unknown>) => {
    if (LOG_LEVELS[logLevel] > LOG_LEVELS.WARN) return

    const timestamp = new Date().toISOString()
    process.stdout.write(`\n⚠️  [WARN] ${timestamp} ${message}\n`)
    if (metadata) {
      process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`)
    }
  },
  error: (message: string, metadata?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString()
    process.stderr.write(`\n❌ [ERROR] ${timestamp} ${message}\n`)
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
  const initialSchema: Schema = { tables: {}, enums: {} }

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

/**
 * Show help information for scripts
 */
export const showHelp = (
  scriptName: string,
  description: string,
  examples: string[],
) => {
  console.info(`
Usage: ${scriptName} [options]

Description:
  ${description}

Options:
  --help, -h           Show this help message and exit
  --log-level=LEVEL    Set the logging level (DEBUG, INFO, WARN, ERROR)
                       Default: INFO (can also be set via LOG_LEVEL env var)

Environment Variables:
  SUPABASE_SERVICE_ROLE_KEY  Required. Supabase service role key for database access
  NEXT_PUBLIC_SUPABASE_URL   Required. Supabase project URL
  OPENAI_API_KEY             Required. OpenAI API key for AI functionality
  LOG_LEVEL                  Optional. Set logging level (overridden by --log-level)

Examples:
${examples.map((example) => `  ${example}`).join('\n')}
`)
}

/**
 * Common user input for business management system design
 */
export const getBusinessManagementSystemUserInput = (): string => {
  return `Design a business management system database with the following core requirements:

1. **Organization Structure**:
   - Hierarchical organizations with self-referencing parent-child relationships
   - Each organization has a unique code and name

2. **Position & Employee Management**:
   - Position master table with unique position codes and names
   - Employee master table with employee codes and names
   - Employee affiliations linking employees to organizations and positions
   - Support for reporting relationships (employees reporting to other employees)

3. **Business Partner System**:
   - Unified business partner table for both clients and suppliers
   - Business partner categories with CHECK constraints (CLIENT/SUPPLIER)
   - Client-specific data with order amounts from last year
   - Supplier-specific data with procurement amounts from last year

4. **Product Management**:
   - Brand master table with unique brand names
   - Item categories for product classification
   - Items with manufacturer part numbers as primary keys
   - Items linked to brands and categories
   - Supplier-brand handling relationships

Please design a normalized database schema with proper primary keys, foreign key relationships, and constraints to support these business operations effectively.`
}

/**
 * Log schema results
 */
export const logSchemaResults = (
  logger: ReturnType<typeof createLogger>,
  schemaData: Schema | undefined,
  currentLogLevel: LogLevel,
  error?: Error,
) => {
  if (error) {
    logger.error(`Workflow completed with error: ${error.message}`)
  }

  // Debug: Log the final workflow state
  logger.debug('Final workflow state:', {
    hasSchemaData: !!schemaData,
    schemaTableKeys: schemaData?.tables
      ? Object.keys(schemaData.tables)
      : 'undefined',
  })

  if (schemaData?.tables) {
    const tableCount = Object.keys(schemaData.tables).length
    if (tableCount > 0) {
      const tableNames = Object.keys(schemaData.tables)
      logger.info(
        `RESULT: ${tableCount} tables created - ${tableNames.join(', ')}`,
      )

      // Log detailed schema information in debug mode
      if (currentLogLevel === 'DEBUG') {
        logger.debug('Schema details:', schemaData)
      }
    } else {
      logger.info('RESULT: No tables created')
    }
  } else {
    logger.info('RESULT: No schema data found')
  }
}
