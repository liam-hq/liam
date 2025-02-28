import type { Indices as IndicesType } from '@liam-hq/db-structure'
import { Hash } from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC } from 'react'
import { CollapsibleHeader } from '../CollapsibleHeader'
import styles from './Indices.module.css'

type Props = {
  indices: IndicesType
}

export const Indices: FC<Props> = ({ indices }) => {
  // NOTE: 17px is the height of one item in the list
  // 24px is the padding of the list
  // 1px is the border of the list
  const contentMaxHeight = Object.keys(indices).length * 17 + 24 + 1
  return (
    <CollapsibleHeader
      title="Indices"
      icon={<Hash width={12} />}
      isContentVisible={true}
      // NOTE: Header height for Columns section:
      // 40px (content) + 1px (border) = 41px
      stickyTopHeight={41}
      contentMaxHeight={contentMaxHeight}
    >
      {Object.keys(indices).length !== 0 && (
        <div className={clsx(styles.listWrapper)}>
          <ul className={styles.list}>
            {Object.entries(indices).map(([key, index]) => (
              <li key={key} className={styles.listItem}>
                {index.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </CollapsibleHeader>
  )
}
