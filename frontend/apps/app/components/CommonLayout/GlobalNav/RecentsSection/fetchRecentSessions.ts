import { createClient } from '../../../../libs/db/server'
import { fetchLatestSessionRunMap } from '../../../../libs/runs/fetchLatestSessionRuns'
import type { SessionStatus } from '../../../ProjectSessionsPage/SessionStatusIndicator'
import type { RecentSession, SessionFilterType } from './types'

export type FetchRecentSessionsOptions = {
  limit?: number
  offset?: number
  filterType?: SessionFilterType
  currentUserId?: string
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type SanitizedSession = {
  id: string
  name: string
  created_at: string
  project_id: string | null
  organization_id: string
  has_schema: boolean
  created_by_user: RecentSession['created_by_user']
}

const toStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' ? value : null

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const hasStringId = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false
  }

  const id = value.id
  return typeof id === 'string'
}

const sanitizeCreatedByUser = (
  value: unknown,
): RecentSession['created_by_user'] => {
  if (!isRecord(value)) {
    return null
  }

  const id = toStringOrNull(value.id)
  const name = toStringOrNull(value.name)
  const email = toStringOrNull(value.email)
  const avatarUrl = toStringOrNull(value.avatar_url)

  if (!id || !name || !email) {
    return null
  }

  return {
    id,
    name,
    email,
    avatar_url: avatarUrl,
  }
}

const sanitizeSession = (rawSession: unknown): SanitizedSession | null => {
  if (!isRecord(rawSession)) {
    return null
  }

  const session = rawSession
  const id = toStringOrNull(session.id)
  const name = toStringOrNull(session.name)
  const createdAt = toStringOrNull(session.created_at)
  const projectId = toStringOrNull(session.project_id)
  const organizationId = toStringOrNull(session.organization_id)
  const createdByUser = sanitizeCreatedByUser(session.created_by_user)

  if (!id || !name || !createdAt || !organizationId) {
    return null
  }

  const buildingSchemas = session.building_schemas

  const hasSchema = Array.isArray(buildingSchemas)
    ? buildingSchemas.some(hasStringId)
    : hasStringId(buildingSchemas)

  return {
    id,
    name,
    created_at: createdAt,
    project_id: projectId,
    organization_id: organizationId,
    has_schema: hasSchema,
    created_by_user: createdByUser,
  }
}

const buildSessionQuery = (
  supabase: SupabaseClient,
  organizationId: string,
  filterType: SessionFilterType,
  currentUserId: string | undefined,
) => {
  let query = supabase
    .from('design_sessions')
    .select(
      `
        id,
        name,
        created_at,
        project_id,
        organization_id,
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

  return query
}

const fetchSessionRows = async (
  supabase: SupabaseClient,
  organizationId: string,
  {
    limit,
    offset,
    filterType,
    currentUserId,
  }: Required<Omit<FetchRecentSessionsOptions, 'currentUserId'>> & {
    currentUserId?: string
  },
) => {
  const { data, error } = await buildSessionQuery(
    supabase,
    organizationId,
    filterType,
    currentUserId,
  )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching recent sessions:', error)
    return []
  }

  return (data ?? [])
    .map((session) => sanitizeSession(session))
    .filter((session): session is SanitizedSession => Boolean(session))
}

export const fetchRecentSessions = async (
  organizationId: string,
  options: FetchRecentSessionsOptions = {},
): Promise<RecentSession[]> => {
  const { limit = 20, offset = 0, filterType = 'me', currentUserId } = options
  const supabase = await createClient()

  const sessions = await fetchSessionRows(supabase, organizationId, {
    limit,
    offset,
    filterType,
    currentUserId,
  })

  const sessionIds = sessions.map((session) => session.id)

  const sessionStatusMap = await fetchLatestSessionRunMap(
    supabase,
    sessionIds,
    { context: 'recents' },
  )

  const toSessionStatus = (status: string | undefined): SessionStatus => {
    if (status === 'error') {
      return 'error'
    }

    if (status === 'completed') {
      return 'completed'
    }

    return 'running'
  }

  return sessions.map((session) => ({
    id: session.id,
    name: session.name,
    created_at: session.created_at,
    project_id: session.project_id,
    organization_id: session.organization_id,
    status: toSessionStatus(sessionStatusMap.get(session.id)?.status),
    latest_run_id: sessionStatusMap.get(session.id)?.latest_run_id ?? null,
    has_schema: session.has_schema,
    created_by_user: session.created_by_user,
  }))
}
