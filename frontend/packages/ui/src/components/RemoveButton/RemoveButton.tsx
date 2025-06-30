import clsx from 'clsx'
import type { FC, MouseEvent } from 'react'
import { X } from '../../icons'
import styles from './RemoveButton.module.css'

export type RemoveButtonVariant = 'transparent' | 'solid'
export type RemoveButtonSize = 'sm' | 'md'

type Props = {
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  variant?: RemoveButtonVariant
  size?: RemoveButtonSize
  className?: string
  'aria-label'?: string
}

export const RemoveButton: FC<Props> = ({
  onClick,
  variant = 'transparent',
  size = 'sm',
  className,
  'aria-label': ariaLabel = 'Remove',
}) => {
  return (
    <button
      type="button"
      className={clsx(
        styles.removeButton,
        styles[variant],
        styles[size],
        className,
      )}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <X className={styles.removeIcon} />
    </button>
  )
}
