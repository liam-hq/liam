'use client'

import '@xyflow/react/dist/style.css'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { type FC, useEffect } from 'react'
import { CardinalityMarkers } from './CardinalityMarkers'
import { NonRelatedTableGroupNode } from './NonRelatedTableGroupNode'
import { RelationshipEdge } from './RelationshipEdge'
import { TableNode } from './TableNode'
import styles from './TopPage.module.css'
import { AFTER_DB, BEFORE_DB } from './constants'
import { convertDBStructureToNodes, mergeDbStructures } from './utils'

const nodeTypes = {
  table: TableNode,
  nonRelatedTableGroup: NonRelatedTableGroupNode,
}

const edgeTypes = {
  relationship: RelationshipEdge,
}

const Content: FC = () => {
  const mergedDbStructure = mergeDbStructures(BEFORE_DB, AFTER_DB)
  const { nodes: _nodes, edges: _edges } = convertDBStructureToNodes({
    dbStructure: mergedDbStructure,
  })

  const [nodes, , onNodesChange] = useNodesState(_nodes)
  const [edges, , onEdgesChange] = useEdgesState(_edges)

  return (
    <div className={styles.wrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      >
        <Background
          color="var(--color-gray-600)"
          variant={BackgroundVariant.Dots}
          size={1}
          gap={16}
        />
      </ReactFlow>
    </div>
  )
}

export const TopPage: FC = () => {
  return (
    <ReactFlowProvider>
      <CardinalityMarkers />
      <Content />
    </ReactFlowProvider>
  )
}
