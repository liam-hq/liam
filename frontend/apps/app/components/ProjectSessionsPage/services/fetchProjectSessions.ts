import { createClient } from '../../../libs/db/server'
import { fetchLatestSessionRunMap } from '../../../libs/runs/fetchLatestSessionRuns'
import type { SessionStatus } from '../SessionStatusIndicator'

export type ProjectSession = {
  id: string
  name: string
  created_at: string
  project_id: string | null
  organization_id: string
  has_schema: boolean
  status: SessionStatus
  run_id: string | null
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

export const fetchProjectSessions = async (
  projectId: string,
  limit = 10,
): Promise<ProjectSession[]> => {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return []
  }

  const { data: sessions, error } = await supabase
    .from('design_sessions')
    .select(
      'id, name, created_at, project_id, organization_id, building_schemas(id)',
    )
    .eq('project_id', projectId)
    .eq('created_by_user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching project sessions:', error)
    return []
  }

  const sessionList: Array<{
    id: string
    name: string
    created_at: string
    project_id: string
    organization_id: string
    has_schema: boolean
  }> =
    sessions?.flatMap((session) => {
      const id = toStringOrNull(session?.id)
      const name = toStringOrNull(session?.name)
      const createdAt = toStringOrNull(session?.created_at)
      const projectIdValue = toStringOrNull(session?.project_id)
      const organizationId = toStringOrNull(session?.organization_id)

      if (!id || !name || !createdAt || !projectIdValue || !organizationId) {
        return []
      }

      const buildingSchemas = session?.building_schemas
      const hasSchema = Array.isArray(buildingSchemas)
        ? buildingSchemas.some(hasStringId)
        : hasStringId(buildingSchemas)

      return [
        {
          id,
          name,
          created_at: createdAt,
          project_id: projectIdValue,
          organization_id: organizationId,
          has_schema: hasSchema,
        },
      ]
    }) ?? []

  const sessionIds = sessionList.map((session) => session.id)
  const sessionStatusMap = await fetchLatestSessionRunMap(
    supabase,
    sessionIds,
    { context: 'project sessions' },
  )

  const toSessionStatus = (status: string | undefined): SessionStatus => {
    if (status === 'error') {
      return 'error'
    }

    if (status === 'completed') {
      return 'completed'
    }

    if (!status) {
      return 'running'
    }

    return 'running'
  }

  return sessionList.map((session) => ({
    id: session.id,
    name: session.name,
    created_at: session.created_at,
    project_id: session.project_id,
    organization_id: session.organization_id,
    status: toSessionStatus(sessionStatusMap.get(session.id)?.latest_status),
    run_id: sessionStatusMap.get(session.id)?.run_id ?? null,
    has_schema: session.has_schema,
  }))
}
