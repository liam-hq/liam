import clsx from 'clsx'
import type { ComponentPropsWithoutRef, FC } from 'react'
import { XIcon } from '../../icons'
import styles from './RemoveButton.module.css'

type Props = ComponentPropsWithoutRef<'button'>

export const RemoveButton: FC<Props> = ({ className, ...props }) => {
  return (
    <button
      type="button"
      className={clsx(styles.removeButton, className)}
      aria-label="Remove"
      {...props}
    >
      <XIcon className={styles.icon} />
    </button>
  )
}
