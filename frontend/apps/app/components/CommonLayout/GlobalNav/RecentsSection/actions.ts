'use server'

import { getOrganizationId } from '../../../../features/organizations/services/getOrganizationId'
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

  const organizationId = organizationIdResult.value
  return fetchRecentSessions(organizationId, options)
}
