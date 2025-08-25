import type { PrimaryKeyConstraint } from '@liam-hq/schema'
import { KeyRound } from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC } from 'react'
import styles from '../Constraints.module.css'
import { PrimaryKeyConstraintsItem } from './PrimaryKeyConstraintsItem'

type Props = {
  tableId: string
  constraints: PrimaryKeyConstraint[]
}

export const PrimaryKeyConstraints: FC<Props> = ({ tableId, constraints }) => {
  return (
    <div className={styles.itemWrapper}>
      <h3 className={styles.sectionTitle}>
        <KeyRound
          className={clsx(
            styles.constraintsIcon,
            styles.primaryConstraintsIcon,
          )}
        />
        Primary key
      </h3>
      {constraints.map((constraint) => (
        <PrimaryKeyConstraintsItem
          key={constraint.name}
          tableId={tableId}
          primaryKeyConstraint={constraint}
        />
      ))}
    </div>
  )
}
