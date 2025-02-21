import type { Columns } from '@liam-hq/db-structure'
import { Fingerprint } from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC } from 'react'
import { CollapsibleHeader } from '../CollapsibleHeader'
import styles from './Unique.module.css'

type Props = {
  columns: Columns
}

export const Unique: FC<Props> = ({ columns }) => {
  const uniqueColumnsCount = Object.values(columns).filter(
    (column) => column.unique,
  ).length
  // NOTE: 17px is the height of one item in the list
  // 24px is the padding of the list
  // 1px is the border of the list
  const contentMaxHeight = uniqueColumnsCount * 17 + 24 + 1
  return (
    <CollapsibleHeader
      title="Unique"
      icon={<Fingerprint width={12} />}
      isContentVisible={true}
      // NOTE: Header height for Columns/Indices sections:
      // (40px (content) + 1px (borders)) * 2 = 82px
      stickyTopHeight={82}
      contentMaxHeight={contentMaxHeight}
    >
      <div className={clsx(styles.listWrapper)}>
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
    </CollapsibleHeader>
  )
}
