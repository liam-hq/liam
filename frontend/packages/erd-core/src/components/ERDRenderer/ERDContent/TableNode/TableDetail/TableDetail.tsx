import { clickLogEvent } from '@/features/gtm/utils'
import { useVersion } from '@/providers'
import type { Table } from '@liam-hq/db-structure'
import { DrawerClose, DrawerTitle, IconButton, XIcon } from '@liam-hq/ui'
import type { FC } from 'react'
import { Columns } from './Columns'
import { Comment } from './Comment'
import { Indices } from './Indices'
import { RelatedTables } from './RelatedTables'
import styles from './TableDetail.module.css'
import { Unique } from './Unique'

type Props = {
  table: Table
}

export const TableDetail: FC<Props> = ({ table }) => {
  const { version } = useVersion()
  const handleDrawerClose = () => {
    version.displayedOn === 'cli' &&
      clickLogEvent({
        element: 'closeTableDetailButton',
        cliVer: version.version,
        appEnv: version.envName,
      })
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <DrawerTitle asChild>
          <h1 className={styles.heading}>{table.name}</h1>
        </DrawerTitle>
        <DrawerClose asChild>
          <IconButton
            icon={<XIcon />}
            tooltipContent="Close"
            onClick={handleDrawerClose}
          />
        </DrawerClose>
      </div>
      <div className={styles.body}>
        {table.comment && <Comment comment={table.comment} />}
        <Columns columns={table.columns} />
        <Indices indices={table.indices} />
        <Unique columns={table.columns} />
        <div className={styles.relatedTables}>
          <RelatedTables key={table.name} table={table} />
        </div>
      </div>
    </section>
  )
}
