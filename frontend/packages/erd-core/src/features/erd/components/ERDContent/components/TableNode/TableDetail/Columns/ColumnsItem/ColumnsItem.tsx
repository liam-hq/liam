import type { Column, Constraints } from '@liam-hq/schema'
import { GridTableRoot } from '@liam-hq/ui'
import { useCopy } from '@liam-hq/ui/hooks'
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
}

const getColumninkHref = (focusColumnName: string) => {
  const searchParams = new URLSearchParams(window.location.search)
  searchParams.set('column', focusColumnName)

  const url = new URL(window.location.href)
  url.search = searchParams.toString()
  return url.toString()
}

export const ColumnsItem: FC<Props> = ({ tableId, column, constraints }) => {
  const { operations } = useSchemaOrThrow()
  const { showDiff, setFocusColumnName } = useUserEditingOrThrow()
  const { copy } = useCopy()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId,
      operations: operations ?? [],
      columnId: column.name,
    })
  }, [showDiff, tableId, operations])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  const constraint = useMemo(
    () =>
      Object.values(constraints).find(
        (constraint) =>
          constraint.type === 'PRIMARY KEY' &&
          constraint.columnNames.includes(column.name),
      ),
    [constraints],
  )

  return (
    <div className={clsx(styles.wrapper, diffStyle)}>
      <h3 className={styles.heading}>
        {column.name}
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => {
            setFocusColumnName(column.name)
            copy(getColumninkHref(column.name))
          }}
        >
          #
        </button>
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
