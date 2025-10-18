import type { Column, Constraints } from '@liam-hq/schema'
import { GridTableRoot } from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, useMemo } from 'react'
import {
  useSchemaOrThrow,
  useUserEditingOrThrow,
} from '../../../../../../../../../stores'
import { useDiffStyle } from '../../../../../../../../diff/hooks/useDiffStyle'
import { getTableColumnElementId } from '../../../../../../../utils/url/getTableColumnElementId'
import {
  CollapsibleHeaderItem,
  CollapsibleHeaderItemHeading,
} from '../../CollapsibleHeader'
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
  focusedElementId: string
}

export const ColumnsItem: FC<Props> = ({
  tableId,
  column,
  constraints,
  focusedElementId,
}) => {
  const elementId = getTableColumnElementId(tableId, column.name)

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

  const isFocused = focusedElementId === elementId

  return (
    <CollapsibleHeaderItem
      id={elementId}
      className={clsx(styles.wrapper, diffStyle)}
      isFocused={isFocused}
    >
      <CollapsibleHeaderItemHeading href={`#${elementId}`}>
        {column.name}
      </CollapsibleHeaderItemHeading>
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
    </CollapsibleHeaderItem>
  )
}
