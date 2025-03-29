import { clsx } from 'clsx'
import type { FC } from 'react'
import styles from './IndexesItem.module.css'

type Props = {
  index: {
    name: string
    unique: boolean
    columns: string[]
    type: string
  }
}

export const IndexesItem: FC<Props> = ({ index }) => {
  const HIDE_INDEX_TYPE = 'btree'

  return (
    <div className={styles.wrapper}>
      <dl className={styles.dl}>
        <div className={styles.dlItem}>
          <dt className={clsx(styles.dt, styles.dtOnly)}>{index.name}</dt>
        </div>
        {index.type && index.type.toLowerCase() !== HIDE_INDEX_TYPE && (
          <div className={styles.dlItem}>
            <dt className={styles.dt}>Type</dt>
            <dd className={styles.dd}>{index.type}</dd>
          </div>
        )}
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
