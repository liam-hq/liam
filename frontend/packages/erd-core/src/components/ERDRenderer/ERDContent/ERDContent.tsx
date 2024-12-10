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
import styles from './ERDContent.module.css'
import { RelationshipEdge } from './RelationshipEdge'
import { TableNode } from './TableNode'
import { Toolbar } from './Toolbar'
// import { useAutoLayout } from './useAutoLayout'
import { useForceLayout } from './useForceLayout'

const nodeTypes = {
  table: TableNode,
}

const edgeTypes = {
  relationship: RelationshipEdge,
}

type Props = {
  nodes: Node[]
  edges: Edge[]
}

export const ERDContent: FC<Props> = ({ nodes: _nodes, edges: _edges }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    setNodes(_nodes)
    setEdges(_edges)
  }, [_nodes, _edges, setNodes, setEdges])

  // useAutoLayout()
  useForceLayout()

  return (
    <div className={styles.wrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.25}
        maxZoom={2}
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
