import { createClient } from '@/libs/db/server'

export type ProjectSession = {
  id: string
  name: string
  created_at: string
  project_id: string | null
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
    .select('id, name, created_at, project_id')
    .eq('project_id', projectId)
    .eq('created_by_user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching project sessions:', error)
    return []
  }

  return sessions.filter(
    (session): session is ProjectSession => session.project_id !== null,
  )
}
