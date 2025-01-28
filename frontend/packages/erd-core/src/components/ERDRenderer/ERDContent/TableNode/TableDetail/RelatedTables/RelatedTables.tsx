import { convertDBStructureToNodes } from '@/components/ERDRenderer/convertDBStructureToNodes'
import { openRelatedTablesLogEvent } from '@/features/gtm/utils'
import { useVersion } from '@/providers'
import {
  replaceHiddenNodeIds,
  updateActiveTableName,
  useDBStructureStore,
} from '@/stores'
import type { Table } from '@liam-hq/db-structure'
import { GotoIcon, IconButton, Waypoints as WaypointsIcon } from '@liam-hq/ui'
import { ReactFlowProvider, useReactFlow } from '@xyflow/react'
import { type FC, useCallback } from 'react'
import { ERDContent } from '../../../ERDContent'
import styles from './RelatedTables.module.css'
import { extractDBStructureForTable } from './extractDBStructureForTable'

type Props = {
  table: Table
}

export const RelatedTables: FC<Props> = ({ table }) => {
  const dbStructure = useDBStructureStore()
  const extractedDBStructure = extractDBStructureForTable(table, dbStructure)
  const { nodes, edges } = convertDBStructureToNodes({
    dbStructure: extractedDBStructure,
    showMode: 'TABLE_NAME',
  })
  const { getNodes } = useReactFlow()
  const { version } = useVersion()
  const handleClick = useCallback(() => {
    const visibleNodeIds: string[] = nodes.map((node) => node.id)
    const mainPaneNodes = getNodes()
    const hiddenNodeIds = mainPaneNodes
      .filter((node) => !visibleNodeIds.includes(node.id))
      .map((node) => node.id)

    replaceHiddenNodeIds(hiddenNodeIds)
    updateActiveTableName(undefined)
    openRelatedTablesLogEvent({
      tableId: table.name,
      platform: version.displayedOn,
      gitHash: version.gitHash,
      ver: version.version,
      appEnv: version.envName,
    })
  }, [nodes, getNodes, table.name, version])

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.iconTitleContainer}>
          <WaypointsIcon width={12} />
          <h2 className={styles.heading}>Related tables</h2>
        </div>
        <IconButton
          icon={<GotoIcon />}
          tooltipContent="Open in main area"
          onClick={handleClick}
        />
      </div>
      <div className={styles.outerWrapper}>
        <div className={styles.contentWrapper}>
          <ReactFlowProvider>
            <ERDContent
              nodes={nodes}
              edges={edges}
              enabledFeatures={{
                fitViewWhenActiveTableChange: false,
                initialFitViewToActiveTable: false,
              }}
            />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  )
}
