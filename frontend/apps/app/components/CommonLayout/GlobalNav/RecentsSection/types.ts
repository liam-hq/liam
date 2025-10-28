import type { SessionStatus } from '../../../ProjectSessionsPage/SessionStatusIndicator'

export type RecentSession = {
  id: string
  name: string
  created_at: string
  project_id: string | null
  organization_id: string
  has_schema: boolean
  status: SessionStatus
  latest_run_id: string | null
  created_by_user: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  } | null
}

export type SessionFilterType = 'all' | 'me' | string
