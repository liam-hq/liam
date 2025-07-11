import type { SupabaseClientType } from '@liam-hq/db'

export async function fetchDesignSessionWithTimelineItems(
  supabase: SupabaseClientType,
  designSessionId: string,
) {
  const { data, error } = await supabase
    .from('design_sessions')
    .select(`
        id,
        organization_id,
        timeline_items (
          id,
          content,
          type,
          user_id,
          created_at,
          organization_id,
          design_session_id,
          building_schema_version_id
        )
      `)
    .eq('id', designSessionId)
    .order('created_at', {
      ascending: true,
      referencedTable: 'timeline_items',
    })
    .single()

  if (error) {
    throw new Error(`Failed to fetch design session: ${error.message}`)
  }

  return data
}
