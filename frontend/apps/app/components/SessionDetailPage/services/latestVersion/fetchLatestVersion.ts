import type { SupabaseClient } from '@liam-hq/db'
import type { Version } from '../../types'

export async function fetchLatestVersion(
  supabase: SupabaseClient,
  buildingSchemaId: string,
): Promise<Version | null> {
  const { data } = await supabase
    .from('building_schema_versions')
    .select('id, number')
    .eq('building_schema_id', buildingSchemaId)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}
