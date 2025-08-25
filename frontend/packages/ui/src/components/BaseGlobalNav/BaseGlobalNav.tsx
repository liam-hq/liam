import clsx from 'clsx'
import type { FC, ReactNode } from 'react'
import styles from './BaseGlobalNav.module.css'

export type BaseGlobalNavProps = {
  logoSection: ReactNode
  navContent?: ReactNode
  footerContent?: ReactNode
  className?: string
  containerClassName?: string
  isExpanded?: boolean
  onHover?: () => void
  onLeave?: () => void
}

export const BaseGlobalNav: FC<BaseGlobalNavProps> = ({
  logoSection,
  navContent,
  footerContent,
  className,
  containerClassName,
  isExpanded = false,
  onHover,
  onLeave,
}) => {
  return (
    <div
      className={clsx(styles.globalNavContainer, containerClassName)}
      data-global-nav-container
    >
      <nav
        className={clsx(
          styles.globalNav,
          isExpanded && styles.expanded,
          className,
        )}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
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
