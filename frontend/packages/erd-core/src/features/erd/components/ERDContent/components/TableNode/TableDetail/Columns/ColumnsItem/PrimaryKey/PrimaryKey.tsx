import { GridTableItem, GridTableRow, KeyRound } from '@liam-hq/ui'
import { type FC, useMemo } from 'react'
import {
  useSchemaOrThrow,
  useUserEditingOrThrow,
} from '../../../../../../../../../../stores'
import { useDiffStyle } from '../../../../../../../../../diff/hooks/useDiffStyle'
import { getChangeStatus } from './getChangeStatus'
import styles from './PrimaryKey.module.css'

type Props = {
  tableId: string
  columnName: string
  constraintName: string
}

export const PrimaryKey: FC<Props> = ({
  tableId,
  columnName,
  constraintName,
}) => {
  const { operations } = useSchemaOrThrow()
  const { showDiff } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId,
      columnId: columnName,
      constraintId: constraintName,
      operations: operations ?? [],
    })
  }, [showDiff, tableId, operations, columnName])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  return (
    <GridTableItem className={diffStyle}>
      <GridTableRow>
        <KeyRound className={styles.primaryKeyIcon} />
        Primary Key
      </GridTableRow>
    </GridTableItem>
  )
}
