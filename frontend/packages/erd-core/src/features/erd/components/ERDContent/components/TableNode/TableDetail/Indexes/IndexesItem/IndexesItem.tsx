import type { Index } from '@liam-hq/schema'
import { GridTableRoot } from '@liam-hq/ui'
import { type FC, useMemo } from 'react'
import {
  useSchemaOrThrow,
  useUserEditingOrThrow,
} from '../../../../../../../../../stores'
import { useDiffStyle } from '../../../../../../../../diff/hooks/useDiffStyle'
import { getTableIndexElementId } from '../../../../../../../utils'
import { DetailItem, DetailItemHeading } from '../../CollapsibleHeader'
import { Columns } from './Columns'
import { getChangeStatus } from './getChangeStatus'
import { Type } from './Type'
import { Unique } from './Unique'

const HIDE_INDEX_TYPE = 'btree'

type Props = {
  tableId: string
  index: Index
  focusedElementId: string
}

export const IndexesItem: FC<Props> = ({
  tableId,
  index,
  focusedElementId,
}) => {
  const elementId = getTableIndexElementId(tableId, index.name)

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

  const isFocused = focusedElementId === elementId

  return (
    <DetailItem id={elementId} className={diffStyle} isFocused={isFocused}>
      <DetailItemHeading href={`#${elementId}`}>{index.name}</DetailItemHeading>
      <GridTableRoot>
        {index.type && index.type.toLowerCase() !== HIDE_INDEX_TYPE && (
          <Type tableId={tableId} index={index} />
        )}
        {!!index.columns.length && <Columns tableId={tableId} index={index} />}
        <Unique tableId={tableId} index={index} />
      </GridTableRoot>
    </DetailItem>
  )
}
