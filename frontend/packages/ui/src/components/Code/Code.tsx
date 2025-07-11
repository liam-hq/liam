import clsx from 'clsx'
import type { FC } from 'react'
import styles from './Code.module.css'

type Props = {
  children: string
  variant?: 'default' | 'primary'
  style?: 'outline' | 'fill'
  size?: 'sm' | 'md' | 'lg'
}

export const Code: FC<Props> = ({
  children,
  variant = 'default',
  style = 'outline',
  size = 'md',
}) => {
  return (
    <span
      className={clsx(
        styles.code,
        styles[variant],
        styles[style],
        styles[size],
      )}
    >
      {children}
    </span>
  )
}
