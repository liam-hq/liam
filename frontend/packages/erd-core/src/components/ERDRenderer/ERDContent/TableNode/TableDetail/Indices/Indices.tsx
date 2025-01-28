import type { Indices as IndicesType } from '@liam-hq/db-structure'
import { Hash } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './Indices.module.css'

type Props = {
  indices: IndicesType
}

export const Indices: FC<Props> = ({ indices }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.iconTitleContainer}>
          <Hash width={12} />
          <h2 className={styles.heading}>Indexes</h2>
        </div>
      </div>
      {Object.keys(indices).length !== 0 && (
        <ul className={styles.list}>
          {Object.entries(indices).map(([key, index]) => (
            <li key={key} className={styles.listItem}>
              {index.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
