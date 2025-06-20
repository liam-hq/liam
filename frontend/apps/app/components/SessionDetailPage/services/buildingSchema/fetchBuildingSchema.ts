import type { SupabaseClient } from '@liam-hq/db'
import type { BuildingSchema } from '../../types'

export async function fetchBuildingSchema(
  supabase: SupabaseClient,
  designSessionId: string,
): Promise<BuildingSchema | null> {
  const { data } = await supabase
    .from('building_schemas')
    .select('id, schema, initial_schema_snapshot')
    .eq('design_session_id', designSessionId)
    .single()

  return data
}
