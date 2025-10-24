'use server'

import { toResultAsync } from '@liam-hq/db'
import { getOrganizationId } from '../../../../features/organizations/services/getOrganizationId'
import { createClient } from '../../../../libs/db/server'
import {
  type FetchRecentSessionsOptions,
  fetchRecentSessions,
} from './fetchRecentSessions'
import type { RecentSession } from './types'

export async function loadMoreSessions(
  options: FetchRecentSessionsOptions,
): Promise<RecentSession[]> {
  const organizationIdResult = await getOrganizationId()
  if (organizationIdResult.isErr()) {
    return []
  }

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id

  const organizationId = organizationIdResult.value
  return fetchRecentSessions(organizationId, {
    ...options,
    currentUserId,
  })
}

export async function fetchFilteredSessions(
  filterType: string,
): Promise<RecentSession[]> {
  const organizationIdResult = await getOrganizationId()
  if (organizationIdResult.isErr()) {
    return []
  }

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id

  const organizationId = organizationIdResult.value
  return fetchRecentSessions(organizationId, {
    filterType,
    currentUserId,
    limit: 20,
    offset: 0,
  })
}

export async function getOrganizationMembers(
  organizationId: string,
): Promise<Array<{ id: string; name: string; email: string }>> {
  const supabase = await createClient()

  const result = await toResultAsync<Array<{
    users: { id: string; name: string; email: string } | null
  }> | null>(
    supabase
      .from('organization_members')
      .select(
        `
      users(
        id,
        name,
        email
      )
    `,
      )
      .eq('organization_id', organizationId),
  )

  return result.match(
    (data) =>
      (data ?? [])
        .map((member) => member.users)
        .filter((user): user is { id: string; name: string; email: string } =>
          Boolean(user),
        ),
    () => [],
  )
}
