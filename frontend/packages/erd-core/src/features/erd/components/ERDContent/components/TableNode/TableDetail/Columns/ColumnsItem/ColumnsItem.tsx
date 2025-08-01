import {
  type Column,
  type Constraints,
  isPrimaryKey,
} from '@liam-hq/db-structure'
import {
  DiamondFillIcon,
  DiamondIcon,
  GridTableDd,
  GridTableDt,
  GridTableItem,
  GridTableRoot,
  GridTableRow,
  KeyRound,
} from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, useMemo } from 'react'
import { useDiffStyle } from '@/features/diff/hooks/useDiffStyle'
import { useSchemaOrThrow, useUserEditingOrThrow } from '@/stores'
import styles from './ColumnsItem.module.css'
import { getChangeStatus } from './getChangeStatus'

type Props = {
  tableId: string
  column: Column
  constraints: Constraints
}

export const ColumnsItem: FC<Props> = ({ tableId, column, constraints }) => {
  const { diffItems } = useSchemaOrThrow()
  const { showDiff } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId,
      diffItems: diffItems ?? [],
      columnId: column.name,
    })
  }, [showDiff, tableId, diffItems])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  return (
    <div className={clsx(styles.wrapper, diffStyle)}>
      <h3 className={styles.heading}>{column.name}</h3>
      {column.comment && <p className={styles.comment}>{column.comment}</p>}
      <GridTableRoot>
        <GridTableItem>
          <GridTableDt>Type</GridTableDt>
          <GridTableDd>{column.type}</GridTableDd>
        </GridTableItem>
        {column.default !== null && (
          <GridTableItem>
            <GridTableDt>Default</GridTableDt>
            <GridTableDd>{column.default}</GridTableDd>
          </GridTableItem>
        )}
        {isPrimaryKey(column.name, constraints) && (
          <GridTableItem>
            <GridTableRow>
              <KeyRound className={styles.primaryKeyIcon} />
              Primary Key
            </GridTableRow>
          </GridTableItem>
        )}
        {column.notNull ? (
          <GridTableItem>
            <GridTableRow>
              <DiamondFillIcon className={styles.diamondIcon} />
              Not-null
            </GridTableRow>
          </GridTableItem>
        ) : (
          <GridTableItem>
            <GridTableRow>
              <DiamondIcon className={styles.diamondIcon} />
              Nullable
            </GridTableRow>
          </GridTableItem>
        )}
      </GridTableRoot>
    </div>
  )
}
