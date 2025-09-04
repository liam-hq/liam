import type { Index } from '@liam-hq/schema'
import { GridTableRoot } from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, useMemo } from 'react'
import {
  useSchemaOrThrow,
  useUserEditingOrThrow,
} from '../../../../../../../../../stores'
import { useDiffStyle } from '../../../../../../../../diff/hooks/useDiffStyle'
import { Columns } from './Columns'
import { getChangeStatus } from './getChangeStatus'
import styles from './IndexesItem.module.css'
import { Name } from './Name'
import { Type } from './Type'
import { Unique } from './Unique'

const HIDE_INDEX_TYPE = 'btree'

type Props = {
  tableId: string
  index: Index
}

export const IndexesItem: FC<Props> = ({ tableId, index }) => {
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
    <div className={clsx(styles.wrapper, diffStyle)}>
      <GridTableRoot>
        <Name tableId={tableId} index={index} />
        {index.type && index.type.toLowerCase() !== HIDE_INDEX_TYPE && (
          <Type tableId={tableId} index={index} />
        )}
        {!!index.columns.length && <Columns tableId={tableId} index={index} />}
        <Unique tableId={tableId} index={index} />
      </GridTableRoot>
    </div>
  )
}
