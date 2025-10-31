import { Skeleton } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './RepositoryListSkeleton.module.css'

const PLACEHOLDER_ITEMS = 6
const PLACEHOLDER_IDS = Array.from({ length: PLACEHOLDER_ITEMS }, (_, index) =>
  index.toString(),
)

export const RepositoryListSkeleton: FC = () => {
  return (
    <div className={styles.wrapper}>
      {PLACEHOLDER_IDS.map((id) => (
        <div key={id} className={styles.item}>
          <Skeleton variant="box" width="100%" height="44px" />
        </div>
      ))}
    </div>
  )
}
