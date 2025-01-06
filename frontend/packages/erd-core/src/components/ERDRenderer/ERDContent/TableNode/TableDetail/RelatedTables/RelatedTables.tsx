import { convertDBStructureToNodes } from '@/components/ERDRenderer/convertDBStructureToNodes'
import { openRelatedTablesLogEvent } from '@/features/gtm/utils'
import { NodesProvider, useNodesContext, useVersion } from '@/providers'
import {
  replaceHiddenNodeIds,
  updateActiveTableName,
  useDBStructureStore,
} from '@/stores'
import type { Table } from '@liam-hq/db-structure'
import { GotoIcon, IconButton } from '@liam-hq/ui'
import { ReactFlowProvider } from '@xyflow/react'
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
  const { nodes: mainPaneNodes } = useNodesContext()
  const { version } = useVersion()
  const handleClick = useCallback(() => {
    const visibleNodeIds: string[] = nodes.map((node) => node.id)
    const hiddenNodeIds = mainPaneNodes
      .filter((node) => !visibleNodeIds.includes(node.id))
      .map((node) => node.id)

    replaceHiddenNodeIds(hiddenNodeIds)
    updateActiveTableName(undefined)
    version.displayedOn === 'cli' &&
      openRelatedTablesLogEvent({
        tableId: table.name,
        cliVer: version.version,
        appEnv: version.envName,
      })
  }, [nodes, mainPaneNodes, table.name, version])

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Related tables</h2>
        <IconButton
          icon={<GotoIcon />}
          tooltipContent="Open in main area"
          onClick={handleClick}
        />
      </div>
      <div className={styles.contentWrapper}>
        <NodesProvider nodes={nodes} edges={edges}>
          <ReactFlowProvider>
            <ERDContent
              enabledFeatures={{
                fitViewWhenActiveTableChange: false,
                initialFitViewToActiveTable: false,
              }}
            />
          </ReactFlowProvider>
        </NodesProvider>
      </div>
    </div>
  )
}
