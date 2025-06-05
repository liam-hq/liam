'use client'

import { createClient } from '@/libs/db/client'

export type RecentSession = {
  id: string
  name: string
  created_at: string
  project_id: string | null
}

export const fetchRecentSessions = async (
  limit = 5,
): Promise<RecentSession[]> => {
  const supabase = createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return []
  }

  const { data: sessions, error } = await supabase
    .from('design_sessions')
    .select('id, name, created_at, project_id')
    .eq('created_by_user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent sessions:', error)
    return []
  }

  return sessions
}
