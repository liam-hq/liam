export type RecentSession = {
  id: string
  name: string
  created_at: string
  project_id: string | null
  created_by_user: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  } | null
}

export type SessionFilterType = 'all' | 'me' | string
