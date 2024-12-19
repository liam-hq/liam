import { convertDBStructureToNodes } from '@/components/ERDRenderer/convertDBStructureToNodes'
import { OpenRelatedTablesLogEvent } from '@/features/gtm/utils'
import { updateActiveTableName, useDBStructureStore } from '@/stores'
import type { Table } from '@liam-hq/db-structure'
import { GotoIcon, IconButton } from '@liam-hq/ui'
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
  const { setNodes } = useReactFlow()
  const handleClick = useCallback(() => {
    const visibleNodeIds: string[] = nodes.map((node) => node.id)
    setNodes((mainPaneNodes) => {
      return mainPaneNodes.map((node) => ({
        ...node,
        hidden: !visibleNodeIds.includes(node.id),
      }))
    })
    updateActiveTableName(undefined)
    OpenRelatedTablesLogEvent({
      tableId: table.name,
    })
  }, [nodes, setNodes, table.name])

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
        <ReactFlowProvider>
          <ERDContent
            nodes={nodes}
            edges={edges}
            enabledFeatures={{ fitViewWhenActiveTableChange: false }}
          />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
