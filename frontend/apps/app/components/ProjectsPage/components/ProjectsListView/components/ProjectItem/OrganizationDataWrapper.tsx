'use client'

import { useEffect, useState, useTransition } from 'react'
import { ProjectIcon } from '@/components/ProjectIcon'
import { fetchOrganizationData } from './OrganizationData'
import { OrganizationIcon } from './OrganizationIcon'
import styles from './ProjectItem.module.css'

type OrganizationDataWrapperProps = {
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
  const [isLoading, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const data = await fetchOrganizationData(installationId, owner, repo)
      setAvatarUrl(data)
    })
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
