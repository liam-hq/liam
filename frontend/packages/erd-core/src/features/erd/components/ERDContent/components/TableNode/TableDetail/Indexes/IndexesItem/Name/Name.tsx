import type { Index } from '@liam-hq/schema'
import { GridTableHeader } from '@liam-hq/ui'
import { type FC, useMemo } from 'react'
import {
  useSchemaOrThrow,
  useUserEditingOrThrow,
} from '../../../../../../../../../../stores'
import { useDiffStyle } from '../../../../../../../../../diff/hooks/useDiffStyle'
import { getChangeStatus } from './getChangeStatus'

type Props = {
  tableId: string
  index: Index
}

export const Name: FC<Props> = ({ tableId, index }) => {
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

  return <GridTableHeader className={diffStyle}>{index.name}</GridTableHeader>
}
