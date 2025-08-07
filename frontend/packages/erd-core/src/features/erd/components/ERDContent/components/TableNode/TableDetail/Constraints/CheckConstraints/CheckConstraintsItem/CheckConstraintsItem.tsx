import type { CheckConstraint } from '@liam-hq/schema'
import { GridTableRoot } from '@liam-hq/ui'
import { type FC, useMemo } from 'react'
import { useDiffStyle } from '@/features/diff/hooks/useDiffStyle'
import { useSchemaOrThrow, useUserEditingOrThrow } from '@/stores'
import { Detail } from './Detail'
import { getChangeStatus } from './getChangeStatus'
import { Name } from './Name'

type Props = {
  tableId: string
  checkConstraint: CheckConstraint
}

export const CheckConstraintsItem: FC<Props> = ({
  tableId,
  checkConstraint,
}) => {
  const { diffItems } = useSchemaOrThrow()
  const { showDiff } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId,
      diffItems: diffItems ?? [],
      constraintId: checkConstraint.name ?? '',
    })
  }, [showDiff, tableId, diffItems, checkConstraint.name])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  return (
    <div className={diffStyle}>
      <GridTableRoot>
        <Name tableId={tableId} constraint={checkConstraint} />
        <Detail tableId={tableId} constraint={checkConstraint} />
      </GridTableRoot>
    </div>
  )
}
