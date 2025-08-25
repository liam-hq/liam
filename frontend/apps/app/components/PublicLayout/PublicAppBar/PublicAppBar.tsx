import type { FC } from 'react'
import styles from './PublicAppBar.module.css'

export const PublicAppBar: FC = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.leftSection}>
        <div className={styles.publicBadge}>
          <span className={styles.icon}>🌐</span>
          <span className={styles.publicText}>Public</span>
        </div>
      </div>
    </div>
  )
}
