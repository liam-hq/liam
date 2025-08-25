import type { Index } from '@liam-hq/schema'
import { GridTableDd, GridTableDt, GridTableItem } from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, useMemo } from 'react'
import { useDiffStyle } from '@/features/diff/hooks/useDiffStyle'
import { useSchemaOrThrow, useUserEditingOrThrow } from '@/stores'
import { getChangeStatus } from './getChangeStatus'

type Props = {
  tableId: string
  index: Index
}

export const Type: FC<Props> = ({ tableId, index }) => {
  const { operations } = useSchemaOrThrow()
  const { showDiff } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId,
      operations: operations ?? [],
      indexId: index.name,
    })
  }, [showDiff, tableId, operations, index.name])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  return (
    <GridTableItem className={clsx(diffStyle)}>
      <GridTableDt>Type</GridTableDt>
      <GridTableDd>{index.type}</GridTableDd>
    </GridTableItem>
  )
}
