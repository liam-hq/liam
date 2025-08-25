import type { PrimaryKeyConstraint } from '@liam-hq/schema'
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
  primaryKeyConstraint: PrimaryKeyConstraint
}

export const PrimaryKeyConstraintsItem: FC<Props> = ({
  tableId,
  primaryKeyConstraint,
}) => {
  const { operations } = useSchemaOrThrow()
  const { showDiff } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId,
      operations: operations ?? [],
      constraintId: primaryKeyConstraint.name,
    })
  }, [showDiff, tableId, operations, primaryKeyConstraint.name])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  return (
    <GridTableRoot>
      <GridTableHeader className={diffStyle}>
        {primaryKeyConstraint.name}
      </GridTableHeader>
      <GridTableItem className={diffStyle}>
        <GridTableDt>
          {primaryKeyConstraint.columnNames.length === 1 ? 'Column' : 'Columns'}
        </GridTableDt>
        <GridTableDd>{primaryKeyConstraint.columnNames.join(', ')}</GridTableDd>
      </GridTableItem>
    </GridTableRoot>
  )
}
