import {
  Background,
  BackgroundVariant,
  type Edge,
  type EdgeMouseHandler,
  type Node,
  type NodeMouseHandler,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { type FC, useCallback, useEffect } from 'react'
import styles from './ERDContent.module.css'
import { RelationshipEdge } from './RelationshipEdge'
import { TableNode } from './TableNode'
import { Toolbar } from './Toolbar'
import { useAutoLayout } from './useAutoLayout'
import { useFitViewWhenActiveTableChange } from './useFitViewWhenActiveTableChange'

const nodeTypes = {
  table: TableNode,
}

const edgeTypes = {
  relationship: RelationshipEdge,
}

type Props = {
  nodes: Node[]
  edges: Edge[]
  enabledFeatures?:
    | {
        fitViewWhenActiveTableChange?: boolean | undefined
      }
    | undefined
}

export const ERDContent: FC<Props> = ({
  nodes: _nodes,
  edges: _edges,
  enabledFeatures,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    setNodes(_nodes)
    setEdges(_edges)
  }, [_nodes, _edges, setNodes, setEdges])

  useAutoLayout()
  useFitViewWhenActiveTableChange(
    enabledFeatures?.fitViewWhenActiveTableChange ?? true,
  )

  const handleMouseEnterNode: NodeMouseHandler<Node> = useCallback(
    (_, { id }) => {
      const relatedEdges = edges.filter(
        (e) => e.source === id || e.target === id,
      )

      const updatedEdges = edges.map((e) =>
        relatedEdges.includes(e)
          ? { ...e, animated: true, data: { ...e.data, isHighlighted: true } }
          : e,
      )

      const updatedNodes = nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, isHighlighted: true } }
        }

        const highlightedTargetHandles = relatedEdges
          .filter((edge) => edge.source === id && edge.target === node.id)
          .map((edge) => edge.targetHandle)

        const highlightedSourceHandles = relatedEdges
          .filter((edge) => edge.target === id && edge.source === node.id)
          .map((edge) => edge.sourceHandle)

        return {
          ...node,
          data: {
            ...node.data,
            highlightedHandles:
              highlightedTargetHandles.concat(highlightedSourceHandles) || [],
          },
        }
      })

      setEdges(updatedEdges)
      setNodes(updatedNodes)
    },
    [edges, nodes, setNodes, setEdges],
  )

  const handleMouseLeaveNode: NodeMouseHandler<Node> = useCallback(
    (_, { id }) => {
      const updatedEdges = edges.map((e) =>
        e.source === id || e.target === id
          ? {
              ...e,
              animated: false,
              data: { ...e.data, isHighlighted: false },
            }
          : e,
      )

      const updatedNodes = nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              isHighlighted: false,
            },
          }
        }

        return {
          ...node,
          data: {
            ...node.data,
            highlightedHandles: [],
          },
        }
      })

      setEdges(updatedEdges)
      setNodes(updatedNodes)
    },
    [edges, nodes, setNodes, setEdges],
  )

  const handleMouseEnterEdge: EdgeMouseHandler<Edge> = useCallback(
    (_, { id }) => {
      setEdges((edges) =>
        edges.map((e) =>
          e.id === id
            ? { ...e, animated: true, data: { ...e.data, isHighlighted: true } }
            : e,
        ),
      )
    },
    [setEdges],
  )

  const handleMouseLeaveEdge: EdgeMouseHandler<Edge> = useCallback(
    (_, { id }) => {
      setEdges((edges) =>
        edges.map((e) =>
          e.id === id
            ? {
                ...e,
                animated: false,
                data: { ...e.data, isHighlighted: false },
              }
            : e,
        ),
      )
    },
    [setEdges],
  )

  return (
    <div className={styles.wrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.1}
        maxZoom={2}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeMouseEnter={handleMouseEnterNode}
        onNodeMouseLeave={handleMouseLeaveNode}
        onEdgeMouseEnter={handleMouseEnterEdge}
        onEdgeMouseLeave={handleMouseLeaveEdge}
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
