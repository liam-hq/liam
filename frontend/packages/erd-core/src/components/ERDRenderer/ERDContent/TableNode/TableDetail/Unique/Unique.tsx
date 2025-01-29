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
      <h2 className={styles.heading}>
        <Fingerprint className={styles.icon} />
        <span>Unique</span>
      </h2>
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
