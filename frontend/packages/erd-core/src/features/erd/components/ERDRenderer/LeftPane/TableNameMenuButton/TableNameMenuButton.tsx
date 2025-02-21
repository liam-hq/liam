import { useTableSelection } from '@/features/erd/hooks'
import type { TableNodeType } from '@/features/erd/types'
import { selectTableLogEvent } from '@/features/gtm/utils'
import { useVersion } from '@/providers'
import { SidebarMenuButton, SidebarMenuItem, Table2 } from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC } from 'react'
import styles from './TableNameMenuButton.module.css'
import { VisibilityButton } from './VisibilityButton'

type Props = {
  node: TableNodeType
}

export const TableNameMenuButton: FC<Props> = ({ node }) => {
  const name = node.data.table.name

  const { selectTable } = useTableSelection()

  // TODO: Move handleClickMenuButton outside of TableNameMenuButton
  // after logging is complete
  const { version } = useVersion()
  const handleClickMenuButton = (tableId: string) => () => {
    selectTable({
      tableId,
      displayArea: 'main',
    })

    selectTableLogEvent({
      ref: 'leftPane',
      tableId,
      platform: version.displayedOn,
      gitHash: version.gitHash,
      ver: version.version,
      appEnv: version.envName,
    })
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={clsx(
          styles.button,
          node.data.isActiveHighlighted && styles.active,
        )}
        asChild
      >
        <div
          // biome-ignore lint/a11y/useSemanticElements: Implemented with div button to be button in button
          role="button"
          tabIndex={0}
          onClick={handleClickMenuButton(name)}
          onKeyDown={handleClickMenuButton(name)}
          aria-label={`Menu button for ${name}`}
        >
          <Table2 size="10px" />
          <span className={styles.tableName}>{name}</span>
          <VisibilityButton tableName={name} hidden={node.hidden} />
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
