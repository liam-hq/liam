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

export const Type: FC<Props> = ({ tableId, column }) => {
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

  return (
    <GridTableItem className={diffStyle}>
      <GridTableDt>Type</GridTableDt>
      <GridTableDd>{column.type}</GridTableDd>
    </GridTableItem>
  )
}
