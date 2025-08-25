import type { CheckConstraint } from '@liam-hq/schema'
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
  checkConstraint: CheckConstraint
}

export const CheckConstraintsItem: FC<Props> = ({
  tableId,
  checkConstraint,
}) => {
  const { operations } = useSchemaOrThrow()
  const { showDiff } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId,
      operations: operations ?? [],
      constraintId: checkConstraint.name,
    })
  }, [showDiff, tableId, operations, checkConstraint.name])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  return (
    <GridTableRoot>
      <GridTableHeader className={diffStyle}>
        {checkConstraint.name}
      </GridTableHeader>
      <GridTableItem className={diffStyle}>
        <GridTableDt>Detail</GridTableDt>
        <GridTableDd>{checkConstraint.detail}</GridTableDd>
      </GridTableItem>
    </GridTableRoot>
  )
}
