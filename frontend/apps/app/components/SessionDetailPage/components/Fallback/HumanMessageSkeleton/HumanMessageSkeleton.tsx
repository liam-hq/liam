import { Skeleton } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './HumanMessageSkeleton.module.css'

export const HumanMessageSkeleton: FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.avatarContainer}>
        <Skeleton variant="circle" size="24px" />
        <Skeleton variant="box" width="80px" height="16px" />
      </div>
      <Skeleton variant="box" width="100%" height="48px" />
    </div>
  )
}
