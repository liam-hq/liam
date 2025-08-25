import type { ForeignKeyConstraint } from '@liam-hq/schema'
import { Link } from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC } from 'react'
import styles from '../Constraints.module.css'
import { ForeignKeyConstraintsItem } from './ForeignKeyConstraintsItem'

type Props = {
  tableId: string
  constraints: ForeignKeyConstraint[]
}

export const ForeignKeyConstraints: FC<Props> = ({ tableId, constraints }) => {
  return (
    <div className={styles.itemWrapper}>
      <h3 className={styles.sectionTitle}>
        <Link
          className={clsx(
            styles.constraintsIcon,
            styles.primaryConstraintsIcon,
          )}
        />
        Foreign key
      </h3>
      {constraints.map((constraint) => (
        <ForeignKeyConstraintsItem
          key={constraint.name}
          tableId={tableId}
          foreignKeyConstraint={constraint}
        />
      ))}
    </div>
  )
}
