import { toResultAsync } from '@liam-hq/db'
import { createClient } from '../../../../libs/db/server'
import type { SessionStatus } from '../../../ProjectSessionsPage/SessionStatusIndicator'
import type { RecentSession, SessionFilterType } from './types'

export type FetchRecentSessionsOptions = {
  limit?: number
  offset?: number
  filterType?: SessionFilterType
  currentUserId?: string
}

type SupabaseRecentSession = {
  id: string
  name: string
  created_at: string
  project_id: string | null
  status: string | null
  building_schemas: Array<{ id: string }> | null
  created_by_user: RecentSession['created_by_user']
}

const normalizeStatus = (status: string | null): SessionStatus => {
  if (status === 'running') {
    return 'running'
  }

  if (status === 'error') {
    return 'error'
  }

  return 'completed'
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
        status,
        building_schemas(id),
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

  const queryPromise = (async () => {
    const response = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const data: SupabaseRecentSession[] | null =
      response.data?.map((session) => ({
        id: session.id,
        name: session.name,
        created_at: session.created_at,
        project_id: session.project_id,
        status: session.status,
        building_schemas: Array.isArray(session.building_schemas)
          ? session.building_schemas
          : session.building_schemas
            ? [session.building_schemas]
            : null,
        created_by_user: session.created_by_user,
      })) ?? null

    return {
      data,
      error: response.error,
    }
  })()

  const result = await toResultAsync<SupabaseRecentSession[] | null>(
    queryPromise,
    { allowNull: true },
  )

  return result.match(
    (sessions) =>
      (sessions ?? []).map((session) => ({
        id: session.id,
        name: session.name,
        created_at: session.created_at,
        project_id: session.project_id,
        status: normalizeStatus(session.status),
        has_schema: Array.isArray(session.building_schemas)
          ? session.building_schemas.length > 0
          : Boolean(session.building_schemas),
        created_by_user: session.created_by_user,
      })),
    () => [],
  )
}
