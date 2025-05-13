'use client'

import { useEffect, useState } from 'react'
import { fetchOrganizationData } from './OrganizationData'
import { OrganizationIcon } from './OrganizationIcon'
import { ProjectIcon } from './ProjectIcon'
import styles from './ProjectItem.module.css'

interface OrganizationDataWrapperProps {
  installationId: number
  owner: string
  repo: string
}

export function OrganizationDataWrapper({
  installationId,
  owner,
  repo,
}: OrganizationDataWrapperProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const data = await fetchOrganizationData(installationId, owner, repo)
      setAvatarUrl(data)
      setIsLoading(false)
    }

    loadData()
  }, [installationId, owner, repo])

  if (isLoading) {
    return <ProjectIcon className={styles.projectIcon} />
  }

  return avatarUrl ? (
    <OrganizationIcon avatarUrl={avatarUrl} owner={owner} />
  ) : (
    <ProjectIcon className={styles.projectIcon} />
  )
}
