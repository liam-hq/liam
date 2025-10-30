import { Skeleton } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './Fallback.module.css'

const SKELETON_KEYS = [0, 1, 2, 3]

export const Fallback: FC = () => {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Recent Sessions</h2>
      <div className={styles.list}>
        {SKELETON_KEYS.map((key) => (
          <div key={key} className={styles.skeletonRow}>
            <Skeleton variant="box" width="40px" height="40px" />
            <div className={styles.skeletonContent}>
              <Skeleton variant="box" width="60%" height="16px" />
              <div className={styles.skeletonSpacer} />
              <Skeleton variant="box" width="30%" height="12px" />
            </div>
            <Skeleton variant="box" width="20px" height="14px" />
          </div>
        ))}
      </div>
    </div>
  )
}
