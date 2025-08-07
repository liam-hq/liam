import type { CheckConstraint } from '@liam-hq/schema'
import { GridTableDd, GridTableDt, GridTableItem } from '@liam-hq/ui'
import { type FC, useMemo } from 'react'
import { useDiffStyle } from '@/features/diff/hooks/useDiffStyle'
import { useSchemaOrThrow, useUserEditingOrThrow } from '@/stores'
import { getChangeStatus } from './getChangeStatus'

type Props = {
  tableId: string
  constraint: CheckConstraint
}

export const Detail: FC<Props> = ({ tableId, constraint }) => {
  const { diffItems } = useSchemaOrThrow()
  const { showDiff } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId,
      diffItems: diffItems ?? [],
      constraintId: constraint.name ?? '',
    })
  }, [showDiff, tableId, diffItems, constraint.name])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  return (
    <GridTableItem className={diffStyle}>
      <GridTableDt>Detail</GridTableDt>
      <GridTableDd>{constraint.detail}</GridTableDd>
    </GridTableItem>
  )
}
