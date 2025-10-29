import type { FC } from 'react'
import styles from './RepositoryListSkeleton.module.css'

const PLACEHOLDER_ITEMS = 6
const PLACEHOLDER_IDS = Array.from({ length: PLACEHOLDER_ITEMS }, (_, index) =>
  index.toString(),
)

export const RepositoryListSkeleton: FC = () => {
  // TODO: Move this skeleton into the shared UI library once we have a general-purpose component.
  return (
    <div className={styles.container}>
      <div className={styles.header} />
      <div className={styles.list}>
        {PLACEHOLDER_IDS.map((id) => (
          <div key={id} className={styles.item} />
        ))}
      </div>
    </div>
  )
}
