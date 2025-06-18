import * as v from 'valibot'
import { createClient } from '@/libs/db/client'

const realtimeBuildingSchemaSchema = v.object({
  design_session_id: v.pipe(v.string(), v.uuid()),
})

/**
 * Client-side version of fetchSchemaData with patch application
 * @param designSessionId The design session ID
 * @returns Schema data with applied patches or null if not found
 */
export async function fetchSchemaDataClient(designSessionId: string) {
  const supabase = createClient()

  const { data: buildingSchema, error: buildingSchemaError } = await supabase
    .from('building_schemas')
    .select('id, schema')
    .eq('design_session_id', designSessionId)
    .single()

  if (buildingSchemaError || !buildingSchema) {
    return { data: null, error: buildingSchemaError }
  }

  // Get the latest version number from building_schema_versions
  const { data: latestVersion, error: versionError } = await supabase
    .from('building_schema_versions')
    .select('number')
    .eq('building_schema_id', buildingSchema.id)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (versionError) {
    return { data: null, error: versionError }
  }

  const latestVersionNumber = latestVersion ? latestVersion.number : 0

  return {
    data: {
      schema: buildingSchema.schema,
      latestVersionNumber,
    },
    error: null,
  }
}

/**
 * Set up realtime subscription for building_schemas in a design session
 * Now only triggers updates, actual data fetching is done via server action
 */
export const setupBuildingSchemaRealtimeSubscription = (
  designSessionId: string,
  onSchemaUpdate: (designSessionId: string) => void,
  onError?: (error: Error) => void,
) => {
  const supabase = createClient()

  const subscription = supabase
    .channel(`building_schemas:${designSessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'building_schemas',
        filter: `design_session_id=eq.${designSessionId}`,
      },
      (payload) => {
        try {
          const updatedBuildingSchema = v.parse(
            realtimeBuildingSchemaSchema,
            payload.new,
          )
          // Only validate that we have a valid design_session_id
          if (updatedBuildingSchema.design_session_id === designSessionId) {
            // NOTE: The payload contains the correct updated schema (structurally correct),
            // but the JSON key order often differs from the DB order, so we intentionally
            // use the regular PostgREST client to re-fetch the data
            onSchemaUpdate(designSessionId)
          }
        } catch (error) {
          onError?.(
            error instanceof Error
              ? error
              : new Error('Realtime update processing failed'),
          )
        }
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
      } else if (status === 'CHANNEL_ERROR') {
        onError?.(new Error('Schema realtime subscription failed'))
      }
    })

  return subscription
}
