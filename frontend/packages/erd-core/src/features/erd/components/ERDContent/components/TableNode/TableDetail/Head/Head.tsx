import type { Table } from '@liam-hq/db-structure'
import {
  DrawerClose,
  DrawerTitle,
  IconButton,
  Table2,
  XIcon,
} from '@liam-hq/ui'
import type { FC } from 'react'
import { clickLogEvent } from '@/features/gtm/utils'
import { useVersionOrThrow } from '@/providers'
import styles from './Head.module.css'

type Props = {
  table: Table
}

export const Head: FC<Props> = ({ table }) => {
  const { version } = useVersionOrThrow()

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
    <div className={styles.header}>
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
