import { clsx } from 'clsx'
import type { FC, ReactNode } from 'react'
import styles from './BaseAppBar.module.css'

export type BaseAppBarProps = {
  leftContent?: ReactNode
  rightContent?: ReactNode
  className?: string
  leftSectionClassName?: string
  rightSectionClassName?: string
}

export const BaseAppBar: FC<BaseAppBarProps> = ({
  leftContent,
  rightContent,
  className,
  leftSectionClassName,
  rightSectionClassName,
}) => {
  return (
    <div className={clsx(styles.wrapper, className)}>
      {leftContent && (
        <div className={clsx(styles.leftSection, leftSectionClassName)}>
          {leftContent}
        </div>
      )}
      {rightContent && (
        <div className={clsx(styles.rightSection, rightSectionClassName)}>
          {rightContent}
        </div>
      )}
    </div>
  )
}
