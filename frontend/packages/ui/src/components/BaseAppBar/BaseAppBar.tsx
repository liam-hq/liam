import { clsx } from 'clsx'
import type { FC, ReactNode } from 'react'
import styles from './BaseAppBar.module.css'

export type BaseAppBarProps = {
  leftContent?: ReactNode
  rightContent?: ReactNode
  className?: string
}

export const BaseAppBar: FC<BaseAppBarProps> = ({
  leftContent,
  rightContent,
  className,
}) => {
  return (
    <div className={clsx(styles.wrapper, className)}>
      {leftContent && <div className={styles.leftSection}>{leftContent}</div>}
      {rightContent && (
        <div className={styles.rightSection}>{rightContent}</div>
      )}
    </div>
  )
}
