'use server'

import { getOrganizationInfo } from '@liam-hq/github'

// Separating data fetching function as a server action
export async function fetchOrganizationData(
  installationId: number,
  owner: string,
  repo: string,
) {
  try {
    if (!installationId || !owner || !repo) {
      return null
    }
    const orgInfo = await getOrganizationInfo(installationId, owner, repo)
    return orgInfo?.avatar_url || null
  } catch (error) {
    console.error('Failed to fetch organization info:', error)
    return null
  }
}
