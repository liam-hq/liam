import clsx from 'clsx'
import type { FC, ReactNode } from 'react'
import styles from './BaseLayout.module.css'

export type BaseLayoutProps = {
  globalNav: ReactNode
  appBar: ReactNode
  children: ReactNode
  className?: string
  mainContentClassName?: string
  contentClassName?: string
}

export const BaseLayout: FC<BaseLayoutProps> = ({
  globalNav,
  appBar,
  children,
  className,
  mainContentClassName,
  contentClassName,
}) => {
  return (
    <div className={clsx(styles.layout, className)}>
      {globalNav}
      <div className={clsx(styles.mainContent, mainContentClassName)}>
        {appBar}
        <main className={clsx(styles.content, contentClassName)}>
          {children}
        </main>
      </div>
    </div>
  )
}
