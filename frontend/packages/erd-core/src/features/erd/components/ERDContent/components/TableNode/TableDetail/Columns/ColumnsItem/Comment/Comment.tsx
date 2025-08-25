import { type Column, getColumnCommentChangeStatus } from '@liam-hq/schema'
import clsx from 'clsx'
import { type FC, useMemo } from 'react'
import { useDiffStyle } from '@/features/diff/hooks/useDiffStyle'
import { useSchemaOrThrow, useUserEditingOrThrow } from '@/stores'
import styles from './Comment.module.css'

type Props = {
  tableId: string
  column: Column
}

export const Comment: FC<Props> = ({ tableId, column }) => {
  const { operations } = useSchemaOrThrow()
  const { showDiff } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getColumnCommentChangeStatus({
      tableId,
      operations: operations ?? [],
      columnId: column.name,
    })
  }, [showDiff, tableId, operations])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  return <p className={clsx(styles.comment, diffStyle)}>{column.comment}</p>
}
