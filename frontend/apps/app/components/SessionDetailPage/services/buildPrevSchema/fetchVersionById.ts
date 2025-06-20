import type { SupabaseClient } from '@liam-hq/db'

export async function fetchVersionById(
  supabase: SupabaseClient,
  versionId: string,
) {
  const { data, error } = await supabase
    .from('building_schema_versions')
    .select('reverse_patch')
    .eq('id', versionId)
    .single()

  if (error) return null

  return data
}
