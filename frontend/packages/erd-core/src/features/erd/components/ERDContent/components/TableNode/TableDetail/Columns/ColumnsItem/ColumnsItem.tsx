import type { Column } from '@liam-hq/db-structure'
import { DiamondFillIcon, DiamondIcon, KeyRound } from '@liam-hq/ui'
import { clsx } from 'clsx'
import type { FC } from 'react'
import styles from './ColumnsItem.module.css'

type Props = {
  column: Column
}

export const ColumnsItem: FC<Props> = ({ column }) => {
  return (
    <div className={styles.wrapper}>
      <h3 className={styles.heading}>{column.name}</h3>
      {column.comment && <p className={styles.comment}>{column.comment}</p>}
      <dl className={styles.dl}>
        <div className={styles.dlItem}>
          <dt className={styles.dt}>Type</dt>
          <dd className={styles.dd}>{column.type}</dd>
        </div>
        {column.default !== null && (
          <div className={styles.dlItem}>
            <dt className={styles.dt}>Default</dt>
            <dd className={styles.dd}>{column.default}</dd>
          </div>
        )}
        {column.primary && (
          <div className={styles.dlItem}>
            <dt className={clsx(styles.dt, styles.dtWithIcon)}>
              <KeyRound className={styles.primaryKeyIcon} />
              <span>Primary Key</span>
            </dt>
          </div>
        )}
        {column.notNull ? (
          <div className={styles.dlItem}>
            <dt className={clsx(styles.dt, styles.dtWithIcon)}>
              <DiamondFillIcon className={styles.diamondIcon} />
              <span>Not-null</span>
            </dt>
          </div>
        ) : (
          <div className={styles.dlItem}>
            <dt className={clsx(styles.dt, styles.dtWithIcon)}>
              <DiamondIcon className={styles.diamondIcon} />
              <span>Nullable</span>
            </dt>
          </div>
        )}
      </dl>
    </div>
  )
}
