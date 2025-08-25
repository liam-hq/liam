import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import type { SetupDatabaseAndUserResult } from './scriptUtils'
import {
  createBuildingSchema,
  createDesignSession,
  createLogger,
} from './scriptUtils'

const logger = createLogger('INFO')

/**
 * Fetch existing design session from database
 */
const fetchDesignSession =
  (sessionId: string) => (setupData: SetupDatabaseAndUserResult) => {
    const { supabaseClient } = setupData

    return ResultAsync.fromPromise(
      supabaseClient
        .from('design_sessions')
        .select('id, name')
        .eq('id', sessionId)
        .single(),
      (error) => new Error(`Failed to fetch design session: ${error}`),
    ).andThen(({ data, error }) => {
      if (error || !data) {
        return errAsync(
          new Error(
            `Design session not found for session ID ${sessionId}: ${error?.message || 'No data'}`,
          ),
        )
      }
      logger.info(`Found design session: ${data.name}`)
      return okAsync({
        ...setupData,
        designSession: data,
      })
    })
  }

/**
 * Type for setup data with design session
 */
type SetupDataWithDesignSession = SetupDatabaseAndUserResult & {
  designSession: { id: string; name: string }
}

/**
 * Fetch existing building schema from database with latest version number
 */
const fetchBuildingSchema = (setupData: SetupDataWithDesignSession) => {
  const { supabaseClient, designSession } = setupData

  return ResultAsync.fromPromise(
    supabaseClient
      .from('building_schemas')
      .select('id')
      .eq('design_session_id', designSession.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    (error) => new Error(`Failed to fetch building schema: ${error}`),
  ).andThen(({ data: schemaData, error: schemaError }) => {
    if (schemaError || !schemaData) {
      return errAsync(
        new Error(
          `Building schema not found for design session ${designSession.id}: ${schemaError?.message || 'No data'}`,
        ),
      )
    }

    return ResultAsync.fromPromise(
      supabaseClient
        .from('building_schema_versions')
        .select('number')
        .eq('building_schema_id', schemaData.id)
        .order('number', { ascending: false })
        .limit(1)
        .maybeSingle(),
      (error) => new Error(`Failed to fetch building schema version: ${error}`),
    ).andThen(({ data: versionData }) => {
      const latestVersionNumber = versionData?.number ?? 0

      logger.info(
        `Found building schema: ${schemaData.id} (version: ${latestVersionNumber})`,
      )

      return okAsync({
        ...setupData,
        buildingSchema: {
          id: schemaData.id,
          latest_version_number: latestVersionNumber,
        },
      })
    })
  })
}

/**
 * Find or create design session
 */
export const findOrCreateDesignSession =
  (resumeSessionId?: string) => (setupData: SetupDatabaseAndUserResult) => {
    if (resumeSessionId) {
      return fetchDesignSession(resumeSessionId)(setupData).andThen(
        fetchBuildingSchema,
      )
    }

    return createDesignSession(setupData).andThen(createBuildingSchema)
  }
