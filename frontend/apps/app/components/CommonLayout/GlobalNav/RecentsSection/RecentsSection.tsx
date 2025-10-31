import { cookies } from 'next/headers'
import { getOrganizationId } from '../../../../features/organizations/services/getOrganizationId'
import { createClient } from '../../../../libs/db/server'
import { getOrganizationMembers } from './actions'
import { SESSION_FILTER_COOKIE } from './constants'
import { fetchRecentSessions } from './fetchRecentSessions'
import { RecentsSectionClient } from './RecentsSectionClient'
import type { SessionFilterType } from './types'

const resolveInitialFilterType = (
  value: string | undefined,
): SessionFilterType => value || 'me'

export const RecentsSection = async () => {
  const organizationIdResult = await getOrganizationId()
  if (organizationIdResult.isErr()) {
    return null
  }

  const organizationId = organizationIdResult.value

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id

  if (!currentUserId) {
    return null
  }

  const cookieStore = await cookies()
  const cookie = cookieStore.get(SESSION_FILTER_COOKIE)
  const savedFilterValue =
    typeof cookie?.value === 'string' ? cookie.value : undefined
  const initialFilterType = resolveInitialFilterType(savedFilterValue)

  const sessions = await fetchRecentSessions(organizationId, {
    filterType: initialFilterType,
    currentUserId,
  })

  const members = await getOrganizationMembers(organizationId)

  return (
    <RecentsSectionClient
      sessions={sessions}
      organizationMembers={members}
      currentUserId={currentUserId}
      organizationId={organizationId}
      initialFilterType={initialFilterType}
    />
  )
}
