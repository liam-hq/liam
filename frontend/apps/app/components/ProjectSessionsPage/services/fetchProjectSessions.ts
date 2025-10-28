import { createClient } from '../../../libs/db/server'
import type { SessionStatus } from '../SessionStatusIndicator'

export type ProjectSession = {
  id: string
  name: string
  created_at: string
  project_id: string | null
  has_schema: boolean
  status: SessionStatus
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
    .select('id, name, created_at, project_id, status, building_schemas(id)')
    .eq('project_id', projectId)
    .eq('created_by_user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching project sessions:', error)
    return []
  }

  return sessions
    .filter(
      (session): session is typeof session & { project_id: string } =>
        session.project_id !== null,
    )
    .map((session) => ({
      id: session.id,
      name: session.name,
      created_at: session.created_at,
      project_id: session.project_id,
      status: normalizeStatus(session.status),
      has_schema:
        Array.isArray(session.building_schemas) &&
        session.building_schemas.length > 0,
    }))
}
