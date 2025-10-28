import { createClient } from '../../../libs/db/server'
import type { SessionStatus } from '../SessionStatusIndicator'

export type ProjectSession = {
  id: string
  name: string
  created_at: string
  project_id: string | null
  organization_id: string
  has_schema: boolean
  status: SessionStatus
  latest_run_id: string | null
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

type SupabaseStatusRow = {
  design_session_id: string | null
  status: string | null
}

type SupabaseRunRow = {
  id: string | null
  design_session_id: string | null
}

const normalizeStatus = (status: string | null): SessionStatus => {
  if (status === 'error') {
    return 'error'
  }

  if (status === 'success') {
    return 'success'
  }

  return 'pending'
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
  const statusMap = new Map<string, SessionStatus>()
  const runIdMap = new Map<string, string>()

  if (sessionIds.length > 0) {
    const [
      { data: statusRows, error: statusError },
      { data: runsRows, error: runsError },
    ]: [
      { data: SupabaseStatusRow[] | null; error: unknown },
      { data: SupabaseRunRow[] | null; error: unknown },
    ] = await Promise.all([
      supabase
        .from('run_status_by_design_session')
        .select('design_session_id, status')
        .in('design_session_id', sessionIds),
      supabase
        .from('runs')
        .select('id, design_session_id, started_at')
        .in('design_session_id', sessionIds)
        .order('started_at', { ascending: false }),
    ])

    if (statusError) {
      console.error(
        'Error fetching run statuses for project sessions:',
        statusError,
      )
    } else {
      statusRows?.forEach((row) => {
        if (typeof row.design_session_id !== 'string') {
          return
        }

        statusMap.set(
          row.design_session_id,
          normalizeStatus(typeof row.status === 'string' ? row.status : null),
        )
      })
    }

    if (runsError) {
      console.error(
        'Error fetching latest runs for project sessions:',
        runsError,
      )
    } else if (runsRows) {
      runsRows.forEach((run) => {
        if (
          typeof run.design_session_id !== 'string' ||
          typeof run.id !== 'string' ||
          runIdMap.has(run.design_session_id)
        ) {
          return
        }

        runIdMap.set(run.design_session_id, run.id)
      })
    }
  }

  return sessionList.map((session) => ({
    id: session.id,
    name: session.name,
    created_at: session.created_at,
    project_id: session.project_id,
    organization_id: session.organization_id,
    status: statusMap.get(session.id) ?? 'pending',
    latest_run_id: runIdMap.get(session.id) ?? null,
    has_schema: session.has_schema,
  }))
}
