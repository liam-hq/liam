import { BaseGlobalNav, LiamDbLogo, LiamLogoMark } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './PublicGlobalNav.module.css'

export const PublicGlobalNav: FC = () => {
  return (
    <BaseGlobalNav
      logoSection={
        <>
          <div className={styles.iconContainer}>
            <LiamLogoMark />
          </div>
          <div className={styles.labelArea}>
            <LiamDbLogo className={styles.liamMigrationLogo} />
          </div>
        </>
      }
    />
  )
}
