import type { Table } from '@liam-hq/schema'
import { Rows3 as Rows3Icon } from '@liam-hq/ui'
import { type FC, useCallback } from 'react'
import { useUserEditingOrThrow } from '../../../../../../../../stores'
import { BlinkCircle } from '../BlinkCircle/BlinkCircle'
import { CollapsibleHeader } from '../CollapsibleHeader'
import styles from './Columns.module.css'
import { ColumnsItem } from './ColumnsItem'

type Props = {
  table: Table
}

export const Columns: FC<Props> = ({ table }) => {
  const { hash, setHash } = useUserEditingOrThrow()

  const scrollToHeader = useCallback(() => {
    const headerId = `${table.name}__columns`
    document.getElementById(headerId)?.scrollIntoView()
    setTimeout(() => setHash(`#${headerId}`), 0)
  }, [table, setHash])

  const scrollToElement = useCallback(
    (columnName: string) => {
      const elementId = `${table.name}__column__${columnName}`
      document.getElementById(elementId)?.scrollIntoView()
      setTimeout(() => setHash(`#${elementId}`), 0)
    },
    [table, setHash],
  )

  // NOTE: 300px is the height of one item in the list(when comments are lengthy)
  const contentMaxHeight = Object.keys(table.columns).length * 300
  return (
    <CollapsibleHeader
      title="Columns"
      headerId={`${table.name}__columns`}
      scrollToHeader={scrollToHeader}
      icon={<Rows3Icon width={12} />}
      isContentVisible={true}
      stickyTopHeight={0}
      contentMaxHeight={contentMaxHeight}
    >
      {Object.entries(table.columns).map(([key, column]) => (
        <div
          className={styles.itemWrapper}
          key={key}
          data-column={column.name}
          id={`${table.name}__column__${column.name}`}
        >
          {hash === `#${table.name}__column__${column.name}` && (
            <div className={styles.blinkCircleWrapper}>
              <BlinkCircle />
            </div>
          )}
          <ColumnsItem
            tableId={table.name}
            column={column}
            constraints={table.constraints}
            scrollToElement={scrollToElement}
          />
        </div>
      ))}
    </CollapsibleHeader>
  )
}
