import { Background, Controls, ReactFlow } from '@xyflow/react'
import type { FC } from 'react'
import { useDBStructureStore } from '../../../stores'
import { convertDBStructureToNodes } from '../convertDBStructureToNodes'
import styles from './ERDContent.module.css'
import { TableNode } from './TableNode'

const nodeTypes = {
  table: TableNode,
}

export const ERDContent: FC = () => {
  const dbStructure = useDBStructureStore()
  const nodes = convertDBStructureToNodes(dbStructure)

  return (
    <div className={styles.wrapper}>
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          /* NOTE: Ensure that the Edge always appears above the Node (Note: The z-index of a selected Node is 1000). */
          zIndex: 1001,
        }}
        minZoom={0.5}
        maxZoom={1}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}
