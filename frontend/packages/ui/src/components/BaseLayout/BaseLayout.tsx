import clsx from 'clsx'
import type { FC, ReactNode } from 'react'
import styles from './BaseLayout.module.css'

export type BaseLayoutProps = {
  globalNav: ReactNode
  appBar: ReactNode
  children: ReactNode
  className?: string
}

export const BaseLayout: FC<BaseLayoutProps> = ({
  globalNav,
  appBar,
  children,
  className,
}) => {
  return (
    <div className={clsx(styles.layout, className)}>
      {globalNav}
      <div className={styles.mainContent}>
        {appBar}
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
