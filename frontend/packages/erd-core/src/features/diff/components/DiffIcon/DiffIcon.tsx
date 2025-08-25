import type { ChangeStatus } from '@liam-hq/schema'
import { Dot, Minus, Plus } from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC } from 'react'
import { match } from 'ts-pattern'
import styles from './DiffIcon.module.css'

type Props = {
  changeStatus: ChangeStatus
}

export const DiffIcon: FC<Props> = ({ changeStatus }) => {
  return match(changeStatus)
    .with('added', () => (
      <Plus className={clsx(styles.diffIcon, styles.addedIcon)} />
    ))
    .with('removed', () => (
      <Minus className={clsx(styles.diffIcon, styles.removedIcon)} />
    ))
    .with('modified', () => (
      <Dot className={clsx(styles.diffIcon, styles.modifiedIcon)} />
    ))
    .otherwise(() => null)
}
