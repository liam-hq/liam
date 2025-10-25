import type { Column, Constraints } from '@liam-hq/schema'
import { GridTableRoot } from '@liam-hq/ui'
import { type FC, useMemo } from 'react'
import {
  useSchemaOrThrow,
  useUserEditingOrThrow,
} from '../../../../../../../../../stores'
import { useDiffStyle } from '../../../../../../../../diff/hooks/useDiffStyle'
import { getTableColumnElementId } from '../../../../../../../utils/url/getTableColumnElementId'
import { DetailItem, DetailItemHeading } from '../../CollapsibleHeader'
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

export const ColumnsItem: FC<Props> = ({ tableId, column, constraints }) => {
  const elementId = getTableColumnElementId(tableId, column.name)

  const { operations } = useSchemaOrThrow()
  const { showDiff, focusedElementId } = useUserEditingOrThrow()

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
    <DetailItem id={elementId} className={diffStyle} isFocused={isFocused}>
      <DetailItemHeading href={`#${elementId}`}>
        {column.name}
      </DetailItemHeading>
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
    </DetailItem>
  )
}
