import type { Table } from '@liam-hq/db-structure'
import {
  DrawerClose,
  DrawerTitle,
  IconButton,
  Table2,
  XIcon,
} from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, useMemo } from 'react'
import { useDiffStyle } from '@/features/diff/hooks/useDiffStyle'
import { clickLogEvent } from '@/features/gtm/utils'
import { useVersionOrThrow } from '@/providers'
import { useSchemaOrThrow, useUserEditingOrThrow } from '@/stores'
import { getChangeStatus } from './getChangeStatus'
import styles from './Head.module.css'

type Props = {
  table: Table
}

export const Head: FC<Props> = ({ table }) => {
  const { version } = useVersionOrThrow()
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

  const handleDrawerClose = () => {
    clickLogEvent({
      element: 'closeTableDetailButton',
      platform: version.displayedOn,
      gitHash: version.gitHash,
      ver: version.version,
      appEnv: version.envName,
    })
  }

  return (
    <div className={clsx(styles.header, showDiff && diffStyle)}>
      <DrawerTitle asChild>
        <div className={styles.iconTitleContainer}>
          <Table2 width={12} />
          <h1 className={styles.heading}>{table.name}</h1>
        </div>
      </DrawerTitle>
      <DrawerClose asChild>
        <IconButton
          icon={<XIcon />}
          tooltipContent="Close"
          onClick={handleDrawerClose}
        />
      </DrawerClose>
    </div>
  )
}
