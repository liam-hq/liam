import clsx from 'clsx'
import type { ReactNode } from 'react'
import { InfoIcon } from '../../icons/InfoIcon'
import styles from './Callout.module.css'

export type CalloutVariant =
  | 'default'
  | 'danger'
  | 'success'
  | 'info'
  | 'warning'

export type CalloutDevice = 'default' | 'mobile'

export type CalloutProps = {
  variant?: CalloutVariant
  device?: CalloutDevice
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function Callout({
  variant = 'default',
  device = 'default',
  icon,
  children,
  className,
}: CalloutProps) {
  const variantClassName = styles[variant]
  const deviceClassName = device === 'mobile' ? styles.mobile : ''

  // Use default icon if none provided
  const iconToRender = icon || <InfoIcon />

  return (
    <div
      className={clsx(
        styles.callout,
        variantClassName,
        deviceClassName,
        className,
      )}
    >
      {iconToRender && (
        <div className={styles.iconContainer}>{iconToRender}</div>
      )}
      <div className={styles.content}>
        <p className={styles.text}>{children}</p>
      </div>
    </div>
  )
}
