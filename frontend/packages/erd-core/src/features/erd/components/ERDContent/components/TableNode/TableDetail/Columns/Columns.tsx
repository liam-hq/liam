import type { Table } from '@liam-hq/schema'
import { Rows3 as Rows3Icon } from '@liam-hq/ui'
import { type FC, useEffect, useRef } from 'react'
import { useUserEditingOrThrow } from '../../../../../../../../stores'
import { CollapsibleHeader } from '../CollapsibleHeader'
import styles from './Columns.module.css'
import { ColumnsItem } from './ColumnsItem'

type Props = {
  table: Table
}

export const Columns: FC<Props> = ({ table }) => {
  const collapsibleContainer = useRef<HTMLDivElement>(null)
  const { focusColumnName } = useUserEditingOrThrow()

  useEffect(() => {
    if (!collapsibleContainer.current) return

    for (const columnItem of Array.from(
      collapsibleContainer.current.children,
    )) {
      if (columnItem.getAttribute('data-column') === focusColumnName) {
        columnItem.scrollIntoView()
        return
      }
    }
  }, [focusColumnName])

  // NOTE: 300px is the height of one item in the list(when comments are lengthy)
  const contentMaxHeight = Object.keys(table.columns).length * 300
  return (
    <CollapsibleHeader
      ref={collapsibleContainer}
      title="Columns"
      icon={<Rows3Icon width={12} />}
      isContentVisible={true}
      stickyTopHeight={0}
      contentMaxHeight={contentMaxHeight}
    >
      {Object.entries(table.columns).map(([key, column]) => (
        <div className={styles.itemWrapper} key={key} data-column={column.name}>
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
