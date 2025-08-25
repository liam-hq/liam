import type { ForeignKeyConstraint } from '@liam-hq/schema'
import { GridTableDd, GridTableDt, GridTableItem, Table2 } from '@liam-hq/ui'
import { type FC, useMemo } from 'react'
import { useDiffStyle } from '@/features/diff/hooks/useDiffStyle'
import { useSchemaOrThrow, useUserEditingOrThrow } from '@/stores'
import { getChangeStatus } from './getChangeStatus'
import styles from './TargetTable.module.css'

type Props = {
  tableId: string
  constraint: ForeignKeyConstraint
}

export const TargetTable: FC<Props> = ({ tableId, constraint }) => {
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
        <Table2 className={styles.tableKeyIcon} />
        Target Table
      </GridTableDt>
      <GridTableDd>
        {constraint.targetTableName} ({constraint.targetColumnNames.join(', ')})
      </GridTableDd>
    </GridTableItem>
  )
}
