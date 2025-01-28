import type { Columns } from '@liam-hq/db-structure'
import { Fingerprint } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './Unique.module.css'

type Props = {
  columns: Columns
}

export const Unique: FC<Props> = ({ columns }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.iconTitleContainer}>
          <Fingerprint width={12} />
          <h2 className={styles.heading}>Unique</h2>
        </div>
      </div>
      <ul className={styles.list}>
        {Object.entries(columns).map(([key, column]) => {
          if (!column.unique) return null
          return (
            <li key={key} className={styles.listItem}>
              {column.name}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
