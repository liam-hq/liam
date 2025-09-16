import type { Table } from '@liam-hq/schema'
import { Rows3 as Rows3Icon } from '@liam-hq/ui'
import { type FC, useEffect, useState } from 'react'
import { BlinkCircle } from '../BlinkCircle/BlinkCircle'
import { CollapsibleHeader } from '../CollapsibleHeader'
import styles from './Columns.module.css'
import { ColumnsItem } from './ColumnsItem'

const columnElementId = (tableName: string, columnName: string) =>
  `${tableName}__columns__${columnName}`

type Props = {
  table: Table
}

export const Columns: FC<Props> = ({ table }) => {
  const [selectedElementId, setSelectedElementId] = useState(
    // location.hash starts with '#'; decode to match actual DOM id
    location.hash.slice(1),
  )

  // update selectedElementId when hash changes
  useEffect(() => {
    const updateState = () => {
      const elementId = location.hash.slice(1)
      setSelectedElementId(elementId)
    }

    window.addEventListener('hashchange', updateState)
    return () => window.removeEventListener('hashchange', updateState)
  }, [])

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
          {selectedElementId === columnElementId(table.name, column.name) && (
            <div className={styles.blinkCircleWrapper}>
              <BlinkCircle />
            </div>
          )}
          <ColumnsItem
            tableId={table.name}
            column={column}
            constraints={table.constraints}
            elementId={columnElementId(table.name, column.name)}
          />
        </div>
      ))}
    </CollapsibleHeader>
  )
}
