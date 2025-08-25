import type { ForeignKeyConstraint } from '@liam-hq/schema'
import { GridTableDd, GridTableDt, GridTableItem } from '@liam-hq/ui'
import { type FC, useMemo } from 'react'
import { useDiffStyle } from '@/features/diff/hooks/useDiffStyle'
import { useSchemaOrThrow, useUserEditingOrThrow } from '@/stores'
import { getChangeStatus } from './getChangeStatus'

type Props = {
  tableId: string
  constraint: ForeignKeyConstraint
}

export const Columns: FC<Props> = ({ tableId, constraint }) => {
  const { operations } = useSchemaOrThrow()
  const { showDiff } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId,
      operations: operations ?? [],
      constraintId: constraint.name,
    })
  }, [showDiff, tableId, operations, constraint.name])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  return (
    <GridTableItem className={diffStyle}>
      <GridTableDt>
        {constraint.columnNames.length === 1 ? 'Column' : 'Columns'}
      </GridTableDt>
      <GridTableDd>{constraint.columnNames.join(', ')}</GridTableDd>
    </GridTableItem>
  )
}
