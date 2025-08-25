import type { SupabaseClientType } from '@liam-hq/db'
import type { DesignSessionWithTimelineItems } from '../../types'

export const fetchDesignSessionWithTimelineItems = async (
  supabase: SupabaseClientType,
  designSessionId: string,
): Promise<DesignSessionWithTimelineItems | null> => {
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
          building_schema_version_id,
          query_result_id,
          assistant_role,
          users (
            id,
            name,
            email
          ),
          building_schema_versions!building_schema_version_id (
            id,
            number,
            patch
          ),
          validation_queries!query_result_id (
            id,
            query_string,
            validation_results (
              id,
              result_set,
              status,
              error_message,
              executed_at
            )
          )
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
