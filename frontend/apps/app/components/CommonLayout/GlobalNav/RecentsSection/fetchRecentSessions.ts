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
    .select('id, name, created_at, project_id')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching recent sessions:', error)
    return []
  }

  return sessions
}
