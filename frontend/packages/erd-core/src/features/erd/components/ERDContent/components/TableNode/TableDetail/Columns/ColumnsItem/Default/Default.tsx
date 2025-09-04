import type { Column } from '@liam-hq/schema'
import { GridTableDd, GridTableDt, GridTableItem } from '@liam-hq/ui'
import { type FC, useMemo } from 'react'
import {
  useSchemaOrThrow,
  useUserEditingOrThrow,
} from '../../../../../../../../../../stores'
import { useDiffStyle } from '../../../../../../../../../diff/hooks/useDiffStyle'
import { getChangeStatus } from './getChangeStatus'

type Props = {
  tableId: string
  column: Column
}

export const Default: FC<Props> = ({ tableId, column }) => {
  const { operations } = useSchemaOrThrow()
  const { showDiff } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId,
      columnId: column.name,
      operations: operations ?? [],
    })
  }, [showDiff, tableId, operations, column.name])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  if (column.default === null) return null

  return (
    <GridTableItem className={diffStyle}>
      <GridTableDt>Default</GridTableDt>
      <GridTableDd>{column.default}</GridTableDd>
    </GridTableItem>
  )
}
