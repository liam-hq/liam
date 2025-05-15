'use server'

import { getOrganizationInfo } from '@liam-hq/github'

// Separating data fetching function as a server action
export async function fetchOrganizationData(
  installationId: number,
  owner: string,
  repo: string,
) {
  if (!installationId || !owner || !repo) {
    return null
  }
  const orgInfo = await getOrganizationInfo(installationId, owner, repo)
  return orgInfo?.avatar_url || null
}
