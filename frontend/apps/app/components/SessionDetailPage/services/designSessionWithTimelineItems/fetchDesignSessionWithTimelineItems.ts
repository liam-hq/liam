import { type SupabaseClientType, toResultAsync } from '@liam-hq/db'
import type { ResultAsync } from 'neverthrow'
import type { DesignSessionWithTimelineItems } from '../../types'

export const fetchDesignSessionWithTimelineItems = (
  supabase: SupabaseClientType,
  designSessionId: string,
): ResultAsync<DesignSessionWithTimelineItems, Error> => {
  return toResultAsync(
    supabase
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
          )
        )
      `)
      .eq('id', designSessionId)
      .order('created_at', {
        ascending: true,
        referencedTable: 'timeline_items',
      })
      .single(),
  )
}
