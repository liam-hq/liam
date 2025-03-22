import type { Column } from '@liam-hq/db-structure'
import { clsx } from 'clsx'
import type { FC } from 'react'
import styles from './IndexesItem.module.css'

type Props = {
  index: {
    name: string
    unique: boolean
    columns: string[]
  }
}

export const IndexesItem: FC<Props> = ({ index }) => {
  return (
    <div className={styles.wrapper}>
      <dl className={styles.dl}>
        <div className={styles.dlItem}>
          <dt className={clsx(styles.dt, styles.dtOnly)}>{index.name}</dt>
        </div>
        {!!index.columns.length && (
          <div className={styles.dlItem}>
            <dt className={styles.dt}>
              {index.columns.length === 1 ? 'Column' : 'Columns'}
            </dt>
            <dd className={styles.dd}>
              {index.columns.length === 1 ? (
                index.columns[0]
              ) : (
                <ol>
                  {index.columns.map((column) => (
                    <li key={column}>{column}</li>
                  ))}
                </ol>
              )}
            </dd>
          </div>
        )}
        <div className={styles.dlItem}>
          <dt className={styles.dt}>Unique</dt>
          <dd className={styles.dd}>{index.unique ? 'Yes' : 'No'}</dd>
        </div>
      </dl>
    </div>
  )
}
