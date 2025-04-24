'use server'

import { getOrganizationInfo } from '@liam-hq/github'
import { OrganizationIcon } from './OrganizationIcon'
import { ProjectIcon } from './ProjectIcon'
import styles from './ProjectItem.module.css'

interface OrganizationDataProps {
  installationId: number
  owner: string
  repo: string
}

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

// Server component
async function OrganizationData({
  installationId,
  owner,
  repo,
}: OrganizationDataProps) {
  const avatarUrl = await fetchOrganizationData(installationId, owner, repo)

  if (avatarUrl) {
    return <OrganizationIcon avatarUrl={avatarUrl} owner={owner} />
  }

  return <ProjectIcon className={styles.projectIcon} />
}
