import { BaseAppBar, Globe } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './PublicAppBar.module.css'

export const PublicAppBar: FC = () => {
  return (
    <BaseAppBar
      leftContent={
        <div className={styles.publicBadge}>
          <Globe className={styles.icon} aria-hidden="true" />
          <span>Public</span>
        </div>
      }
    />
  )
}
