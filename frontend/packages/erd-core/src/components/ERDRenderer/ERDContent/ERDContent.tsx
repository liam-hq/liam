import {
  Background,
  BackgroundVariant,
  type Edge,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { type FC, useEffect } from 'react'
import { useDBStructureStore } from '../../../stores'
import { convertDBStructureToNodes } from '../convertDBStructureToNodes'
import styles from './ERDContent.module.css'
import { RelationshipEdge } from './RelationshipEdge'
import { TableNode } from './TableNode'
import { Toolbar } from './Toolbar'
import { useAutoLayout } from './useAutoLayout'

const nodeTypes = {
  table: TableNode,
}

const edgeTypes = {
  relationship: RelationshipEdge,
}

export const ERDContent: FC = () => {
  const dbStructure = useDBStructureStore()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    const { nodes, edges } = convertDBStructureToNodes(dbStructure)
    setNodes(nodes)
    setEdges(edges)
  }, [dbStructure, setNodes, setEdges])

  useAutoLayout()

  return (
    <div className={styles.wrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.5}
        maxZoom={1}
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
      <div className={styles.toolbarWrapper}>
        <Toolbar />
      </div>
    </div>
  )
}
