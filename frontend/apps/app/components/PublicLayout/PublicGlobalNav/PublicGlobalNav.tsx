import type { FC } from 'react'
import { LiamDbLogo, LiamLogoMark } from '@/logos'
import styles from './PublicGlobalNav.module.css'

export const PublicGlobalNav: FC = () => {
  return (
    <div className={styles.globalNavContainer}>
      <nav className={styles.globalNav}>
        <div className={styles.logoContainer}>
          <div className={styles.logoSection}>
            <div className={styles.iconContainer}>
              <LiamLogoMark />
            </div>
            <div className={styles.labelArea}>
              <LiamDbLogo className={styles.liamMigrationLogo} />
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}
