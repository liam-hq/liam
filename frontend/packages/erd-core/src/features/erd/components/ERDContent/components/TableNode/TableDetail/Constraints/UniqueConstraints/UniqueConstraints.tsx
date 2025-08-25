import type { UniqueConstraint } from '@liam-hq/schema'
import { Fingerprint } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from '../Constraints.module.css'
import { UniqueConstraintsItem } from './UniqueConstraintsItem'

type Props = {
  tableId: string
  constraints: UniqueConstraint[]
}

export const UniqueConstraints: FC<Props> = ({ tableId, constraints }) => {
  return (
    <div className={styles.itemWrapper}>
      <h3 className={styles.sectionTitle}>
        <Fingerprint className={styles.constraintsIcon} />
        Unique
      </h3>
      {constraints.map((constraint) => (
        <UniqueConstraintsItem
          key={constraint.name}
          tableId={tableId}
          uniqueConstraint={constraint}
        />
      ))}
    </div>
  )
}
