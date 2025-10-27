import { getOrganizationId } from '../../../../features/organizations/services/getOrganizationId'
import { createClient } from '../../../../libs/db/server'
import { getOrganizationMembers } from './actions'
import { fetchRecentSessions } from './fetchRecentSessions'
import { RecentsSectionClient } from './RecentsSectionClient'

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

  const sessions = await fetchRecentSessions(organizationId, {
    filterType: 'me',
    currentUserId,
  })

  const members = await getOrganizationMembers(organizationId)

  return (
    <RecentsSectionClient
      sessions={sessions}
      organizationMembers={members}
      currentUserId={currentUserId}
    />
  )
}
