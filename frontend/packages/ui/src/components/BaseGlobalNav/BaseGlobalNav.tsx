import clsx from 'clsx'
import type { FC, ReactNode } from 'react'
import styles from './BaseGlobalNav.module.css'

export type BaseGlobalNavProps = {
  logoSection: ReactNode
  navContent?: ReactNode
  footerContent?: ReactNode
  className?: string
}

export const BaseGlobalNav: FC<BaseGlobalNavProps> = ({
  logoSection,
  navContent,
  footerContent,
  className,
}) => {
  return (
    <div className={styles.globalNavContainer} data-global-nav-container>
      <nav className={clsx(styles.globalNav, className)}>
        <div className={styles.logoContainer}>
          <div className={styles.logoSection}>{logoSection}</div>
        </div>
        {navContent && <div className={styles.navSection}>{navContent}</div>}
        {footerContent && (
          <div className={styles.footerSection}>{footerContent}</div>
        )}
      </nav>
    </div>
  )
}
