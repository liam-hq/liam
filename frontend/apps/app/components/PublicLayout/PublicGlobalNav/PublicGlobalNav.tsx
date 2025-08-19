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

        <div className={styles.navSection}>
          <div className={styles.publicIndicator}>
            <div className={styles.icon}>🌐</div>
            <span className={styles.label}>Public View</span>
          </div>
        </div>
      </nav>
    </div>
  )
}