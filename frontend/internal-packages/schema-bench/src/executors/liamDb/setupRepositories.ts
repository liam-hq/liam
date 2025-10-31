import { createSupabaseRepositories } from '@liam-hq/agent'
import {
  createClient,
  type SupabaseClientType,
  toResultAsync,
} from '@liam-hq/db'
import { err, ok, type Result, type ResultAsync } from '@liam-hq/neverthrow'

type Repositories = ReturnType<typeof createSupabaseRepositories>

type SetupResult = {
  repositories: Repositories
  organizationId: string
  buildingSchemaId: string
  designSessionId: string
  userId: string
}

let cachedSetup: SetupResult | null = null

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
const getFirstOrganization = (
  supabaseClient: SupabaseClientType,
): ResultAsync<{ id: string }, Error> => {
  return toResultAsync(
    supabaseClient.from('organizations').select('id').limit(1).single(),
  )
}

/**
 * Get the first user from database
 */
const getUser = (
  supabaseClient: SupabaseClientType,
): ResultAsync<{ id: string }, Error> => {
  return toResultAsync(
    supabaseClient.from('users').select('id').limit(1).single(),
  )
}

const getDesignSession = (
  supabaseClient: SupabaseClientType,
  organizationId: string,
): ResultAsync<{ id: string }, Error> => {
  return toResultAsync(
    supabaseClient
      .from('design_sessions')
      .select('id')
      .eq('organization_id', organizationId)
      .limit(1)
      .single(),
  )
}

const createDesignSession = (
  supabaseClient: SupabaseClientType,
  organizationId: string,
  userId: string,
): ResultAsync<{ id: string }, Error> => {
  return toResultAsync(
    supabaseClient
      .from('design_sessions')
      .insert({
        name: 'Schema Benchmark Session',
        project_id: null,
        organization_id: organizationId,
        created_by_user_id: userId,
        parent_design_session_id: null,
      })
      .select('id')
      .single(),
  )
}

/**
 * Get or create a design session for benchmarking
 */
const getOrCreateDesignSession = (
  supabaseClient: SupabaseClientType,
  organizationId: string,
  userId: string,
): ResultAsync<{ id: string }, Error> => {
  return getDesignSession(supabaseClient, organizationId).orElse(() =>
    createDesignSession(supabaseClient, organizationId, userId),
  )
}

const getBuildingSchema = (
  supabaseClient: SupabaseClientType,
  designSessionId: string,
): ResultAsync<{ id: string }, Error> => {
  return toResultAsync(
    supabaseClient
      .from('building_schemas')
      .select('id')
      .eq('design_session_id', designSessionId)
      .limit(1)
      .single(),
  )
}

const createBuildingSchema = (
  supabaseClient: SupabaseClientType,
  designSessionId: string,
  organizationId: string,
): ResultAsync<{ id: string }, Error> => {
  const initialSchema = { tables: {}, enums: {}, extensions: {} }
  return toResultAsync(
    supabaseClient
      .from('building_schemas')
      .insert({
        design_session_id: designSessionId,
        organization_id: organizationId,
        schema: structuredClone(initialSchema),
        initial_schema_snapshot: structuredClone(initialSchema),
        schema_file_path: null,
        git_sha: null,
      })
      .select('id')
      .single(),
  )
}

/**
 * Get or create a building schema for the design session
 */
const getOrCreateBuildingSchema = (
  supabaseClient: SupabaseClientType,
  designSessionId: string,
  organizationId: string,
): ResultAsync<{ id: string }, Error> => {
  return getBuildingSchema(supabaseClient, designSessionId).orElse(() =>
    createBuildingSchema(supabaseClient, designSessionId, organizationId),
  )
}

/**
 * Setup Supabase repositories for schema benchmark
 * Uses singleton pattern to reuse connections across benchmark runs
 */
export const setupRepositories = async (): Promise<
  Result<SetupResult, Error>
> => {
  // Return cached setup if available
  if (cachedSetup) {
    return ok(cachedSetup)
  }

  // Create database connection
  const connectionResult = createDatabaseConnection()
  if (connectionResult.isErr()) {
    return err(connectionResult.error)
  }
  const supabaseClient = connectionResult.value

  return await getFirstOrganization(supabaseClient)
    .andThen((organization) =>
      getUser(supabaseClient).andThen((user) =>
        getOrCreateDesignSession(
          supabaseClient,
          organization.id,
          user.id,
        ).andThen((designSession) =>
          getOrCreateBuildingSchema(
            supabaseClient,
            designSession.id,
            organization.id,
          ).map((buildingSchema) => ({
            organization,
            user,
            designSession,
            buildingSchema,
          })),
        ),
      ),
    )
    .map(({ organization, user, designSession, buildingSchema }) => {
      const repositories = createSupabaseRepositories(
        supabaseClient,
        organization.id,
      )

      cachedSetup = {
        repositories,
        organizationId: organization.id,
        buildingSchemaId: buildingSchema.id,
        designSessionId: designSession.id,
        userId: user.id,
      }

      return cachedSetup
    })
}
