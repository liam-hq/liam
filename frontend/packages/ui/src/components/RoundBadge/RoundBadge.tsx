import clsx from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import styles from './RoundBadge.module.css'

export type RoundBadgeProps = ComponentProps<'span'> & {
  /**
   * The content to be displayed inside the badge
   */
  children: ReactNode
  /**
   * Optional variant for different visual styles
   */
  variant?: 'default' | 'yellow' | 'green' | 'purple'
  /**
   * When true, the value will be capped at 99+ for large numbers
   */
  showCap?: boolean
  /**
   * Optional maximum value to display before showing a "+" suffix
   */
  maxValue?: number
}

const RoundBadge = ({
  children,
  className,
  variant = 'default',
  showCap = true,
  maxValue = 99,
  ...props
}: RoundBadgeProps) => {
  const content =
    typeof children === 'number' && showCap && children > maxValue
      ? `${maxValue}+`
      : children

  return (
    <span className={clsx(styles.badge, styles[variant], className)} {...props}>
      {content}
    </span>
  )
}

export { RoundBadge }
