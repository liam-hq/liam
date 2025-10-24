import { toResultAsync } from '@liam-hq/db'
import { createClient } from '../../../../libs/db/server'
import type { RecentSession, SessionFilterType } from './types'

export type FetchRecentSessionsOptions = {
  limit?: number
  offset?: number
  filterType?: SessionFilterType
  currentUserId?: string
}

export const fetchRecentSessions = async (
  organizationId: string,
  options: FetchRecentSessionsOptions = {},
): Promise<RecentSession[]> => {
  const { limit = 20, offset = 0, filterType = 'me', currentUserId } = options
  const supabase = await createClient()

  let query = supabase
    .from('design_sessions')
    .select(
      `
      id,
      name,
      created_at,
      project_id,
      created_by_user:created_by_user_id(
        id,
        name,
        email,
        avatar_url
      )
    `,
    )
    .eq('organization_id', organizationId)

  if (filterType === 'me' && currentUserId) {
    query = query.eq('created_by_user_id', currentUserId)
  } else if (filterType !== 'all' && filterType !== 'me') {
    query = query.eq('created_by_user_id', filterType)
  }

  const result = await toResultAsync<RecentSession[] | null>(
    query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    { allowNull: true },
  )

  return result.match(
    (sessions) => sessions ?? [],
    () => [],
  )
}
