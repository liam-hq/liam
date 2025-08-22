'use client'

import Image from 'next/image'
import { ProjectIcon } from '@/components/ProjectIcon'
import styles from './ProjectItem.module.css'

type OrganizationIconProps = {
  // eslint-disable-next-line no-restricted-syntax
  avatarUrl?: string | null
  owner: string
}

export function OrganizationIcon({ avatarUrl, owner }: OrganizationIconProps) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={`${owner} organization icon`}
        width={32}
        height={32}
        className={styles.projectIcon}
      />
    )
  }

  return <ProjectIcon className={styles.projectIcon} />
}
