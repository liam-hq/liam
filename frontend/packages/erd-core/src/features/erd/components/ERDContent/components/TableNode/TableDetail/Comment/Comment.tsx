import type { Table } from '@liam-hq/db-structure'
import { DrawerDescription } from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, useMemo } from 'react'
import { useDiffStyle } from '@/features/diff/hooks/useDiffStyle'
import { useSchemaOrThrow, useUserEditingOrThrow } from '@/stores'
import styles from './Comment.module.css'
import { getChangeStatus } from './getChangeStatus'

type Props = {
  table: Table
}

export const Comment: FC<Props> = ({ table }) => {
  const { diffItems } = useSchemaOrThrow()
  const { showDiff } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId: table.name,
      diffItems: diffItems ?? [],
    })
  }, [showDiff, table.name, diffItems])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  return (
    <div className={clsx(styles.wrapper, showDiff && diffStyle)}>
      <DrawerDescription className={styles.text}>
        {table.comment}
      </DrawerDescription>
    </div>
  )
}
