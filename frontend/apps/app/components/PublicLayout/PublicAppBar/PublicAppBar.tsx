import { appBarStyles } from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC } from 'react'
import styles from './PublicAppBar.module.css'

export const PublicAppBar: FC = () => {
  return (
    <div className={clsx(appBarStyles.wrapper)}>
      <div className={clsx(appBarStyles.leftSection)}>
        <div className={styles.publicBadge}>
          <span className={styles.icon}>🌐</span>
          <span className={styles.publicText}>Public</span>
        </div>
      </div>
    </div>
  )
}
