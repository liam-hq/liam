import type { Table } from '@liam-hq/db-structure'
import { DrawerDescription } from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, useMemo } from 'react'
import { match } from 'ts-pattern'
import diffStyles from '@/features/diff/styles/Diff.module.css'
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
  }, [showDiff, name, diffItems])

  const diffStyle = useMemo(() => {
    if (!showDiff || !changeStatus) return undefined
    return match(changeStatus)
      .with('added', () => diffStyles.addedBg)
      .with('removed', () => diffStyles.removedBg)
      .with('modified', () => diffStyles.modifiedBg)
      .otherwise(() => undefined)
  }, [showDiff, changeStatus])

  return (
    <div className={clsx(styles.wrapper, showDiff && diffStyle)}>
      <DrawerDescription className={styles.text}>
        {table.comment}
      </DrawerDescription>
    </div>
  )
}
