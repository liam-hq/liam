import { createClient } from '../../../../libs/db/server'
import type { RecentSession } from './types'

export type FetchRecentSessionsOptions = {
  limit?: number
  offset?: number
}

export const fetchRecentSessions = async (
  organizationId: string,
  options: FetchRecentSessionsOptions = {},
): Promise<RecentSession[]> => {
  const { limit = 20, offset = 0 } = options
  const supabase = await createClient()

  const { data: sessions, error } = await supabase
    .from('design_sessions')
    .select('id, name, created_at, project_id, status, building_schemas(id)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching recent sessions:', error)
    return []
  }

  return sessions.map((session) => ({
    id: session.id,
    name: session.name,
    created_at: session.created_at,
    project_id: session.project_id,
    status: session.status,
    has_schema:
      Array.isArray(session.building_schemas) &&
      session.building_schemas.length > 0,
  }))
}
