import type { Table } from '@liam-hq/schema'
import { Rows3 as Rows3Icon } from '@liam-hq/ui'
import type { FC } from 'react'
import { CollapsibleHeader } from '../CollapsibleHeader'
import styles from './Columns.module.css'
import { ColumnsItem } from './ColumnsItem'

type Props = {
  table: Table
}

export const Columns: FC<Props> = ({ table }) => {
  // NOTE: 300px is the height of one item in the list(when comments are lengthy)
  const contentMaxHeight = Object.keys(table.columns).length * 300
  return (
    <CollapsibleHeader
      title="Columns"
      icon={<Rows3Icon width={12} />}
      isContentVisible={true}
      stickyTopHeight={0}
      contentMaxHeight={contentMaxHeight}
    >
      {Object.entries(table.columns).map(([key, column]) => (
        <div className={styles.itemWrapper} key={key}>
          <ColumnsItem
            tableId={table.name}
            column={column}
            constraints={table.constraints}
          />
        </div>
      ))}
    </CollapsibleHeader>
  )
}
