import type { Column, Constraints } from '@liam-hq/schema'
import { GridTableRoot } from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, useMemo } from 'react'
import {
  useSchemaOrThrow,
  useUserEditingOrThrow,
} from '../../../../../../../../../stores'
import { useDiffStyle } from '../../../../../../../../diff/hooks/useDiffStyle'
import styles from './ColumnsItem.module.css'
import { Comment } from './Comment'
import { Default } from './Default'
import { getChangeStatus } from './getChangeStatus'
import { NotNull } from './NotNull'
import { PrimaryKey } from './PrimaryKey'
import { Type } from './Type'

type Props = {
  tableId: string
  column: Column
  constraints: Constraints
  scrollToElement: (columnName: string) => void
}

export const ColumnsItem: FC<Props> = ({
  tableId,
  column,
  constraints,
  scrollToElement,
}) => {
  const { operations } = useSchemaOrThrow()
  const { showDiff } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId,
      operations: operations ?? [],
      columnId: column.name,
    })
  }, [showDiff, tableId, operations, column.name])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  const constraint = useMemo(
    () =>
      Object.values(constraints).find(
        (constraint) =>
          constraint.type === 'PRIMARY KEY' &&
          constraint.columnNames.includes(column.name),
      ),
    [constraints, column.name],
  )

  return (
    <div className={clsx(styles.wrapper, diffStyle)}>
      <h3 className={styles.heading}>
        <a
          className={styles.columnLink}
          href={`#${tableId}__column__${column.name}`}
          onClick={(event) => {
            // Do not call preventDefault to allow the default link behavior when ⌘ key is pressed
            if (event.metaKey || event.ctrlKey) {
              return
            }

            event.preventDefault()
            scrollToElement(column.name)
          }}
          aria-label={column.name}
        >
          {column.name} #
        </a>
      </h3>

      {column.comment && <Comment tableId={tableId} column={column} />}
      <GridTableRoot>
        <Type tableId={tableId} column={column} />
        <Default tableId={tableId} column={column} />
        {constraint && (
          <PrimaryKey
            tableId={tableId}
            columnName={column.name}
            constraintName={constraint.name}
          />
        )}
        <NotNull tableId={tableId} column={column} />
      </GridTableRoot>
    </div>
  )
}
