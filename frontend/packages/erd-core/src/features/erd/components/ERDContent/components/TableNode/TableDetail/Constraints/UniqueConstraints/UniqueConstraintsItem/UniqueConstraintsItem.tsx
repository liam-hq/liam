import type { UniqueConstraint } from '@liam-hq/schema'
import {
  GridTableDd,
  GridTableDt,
  GridTableHeader,
  GridTableItem,
  GridTableRoot,
} from '@liam-hq/ui'
import { type FC, useMemo } from 'react'
import { useDiffStyle } from '@/features/diff/hooks/useDiffStyle'
import { useSchemaOrThrow, useUserEditingOrThrow } from '@/stores'
import { getChangeStatus } from './getChangeStatus'

type Props = {
  tableId: string
  uniqueConstraint: UniqueConstraint
}

export const UniqueConstraintsItem: FC<Props> = ({
  tableId,
  uniqueConstraint,
}) => {
  const { operations } = useSchemaOrThrow()
  const { showDiff } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId,
      operations: operations ?? [],
      constraintId: uniqueConstraint.name,
    })
  }, [showDiff, tableId, operations, uniqueConstraint.name])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  return (
    <GridTableRoot>
      <GridTableHeader className={diffStyle}>
        {uniqueConstraint.name}
      </GridTableHeader>
      <GridTableItem className={diffStyle}>
        <GridTableDt>
          {uniqueConstraint.columnNames.length === 1 ? 'Column' : 'Columns'}
        </GridTableDt>
        <GridTableDd>{uniqueConstraint.columnNames.join(', ')}</GridTableDd>
      </GridTableItem>
    </GridTableRoot>
  )
}
