import clsx from 'clsx'
import type { ComponentPropsWithoutRef, FC } from 'react'
import { XIcon } from '../../icons'
import styles from './RemoveButton.module.css'

export type RemoveButtonVariant = 'transparent' | 'solid'
export type RemoveButtonSize = 'sm' | 'md'

type Props = ComponentPropsWithoutRef<'button'> & {
  variant?: RemoveButtonVariant
  size?: RemoveButtonSize
}

export const RemoveButton: FC<Props> = ({
  className,
  variant = 'transparent',
  size = 'sm',
  'aria-label': ariaLabel = 'Remove',
  ...props
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
      aria-label={ariaLabel}
      {...props}
    >
      <XIcon className={styles.removeIcon} />
    </button>
  )
}
