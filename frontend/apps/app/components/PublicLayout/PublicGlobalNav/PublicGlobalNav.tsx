import { BaseGlobalNav } from '@liam-hq/ui'
import type { FC } from 'react'
import { LiamDbLogo, LiamLogoMark } from '@/logos'
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
