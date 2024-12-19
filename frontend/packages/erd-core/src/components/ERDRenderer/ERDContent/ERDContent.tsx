import { updateActiveTableName, useDBStructureStore } from '@/stores'
import type { Relationships } from '@liam-hq/db-structure'
import {
  Background,
  BackgroundVariant,
  type Edge,
  type Node,
  type NodeMouseHandler,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { type FC, type ReactNode, useCallback, useState } from 'react'
import styles from './ERDContent.module.css'
import { ERDContentProvider, useERDContentContext } from './ERDContentContext'
import { RelationshipEdge } from './RelationshipEdge'
import { Spinner } from './Spinner'
import { TableNode } from './TableNode'
import { highlightNodesAndEdges } from './highlightNodesAndEdges'
import { useFitViewWhenActiveTableChange } from './useFitViewWhenActiveTableChange'
import { useInitialAutoLayout } from './useInitialAutoLayout'
import { useUpdateNodeCardinalities } from './useUpdateNodeCardinalities'

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
  children?: ReactNode
}

const highlightEdge = (edge: Edge): Edge => ({
  ...edge,
  animated: true,
  data: { ...edge.data, isHighlighted: true },
})

const unhighlightEdge = (edge: Edge): Edge => ({
  ...edge,
  animated: false,
  data: { ...edge.data, isHighlighted: false },
})

export const isRelatedToTable = (
  relationships: Relationships,
  tableName: string,
  targetTableName: string | undefined,
) => {
  if (!targetTableName) {
    return false
  }
  return Object.values(relationships).some(
    (relationship) =>
      (relationship.primaryTableName === tableName ||
        relationship.foreignTableName === tableName) &&
      (relationship.primaryTableName === targetTableName ||
        relationship.foreignTableName === targetTableName),
  )
}

const getHighlightedHandles = (
  edges: Edge[],
  targetId: string,
  nodeId: string,
) => {
  const highlightedTargetHandles = edges
    .filter((edge) => edge.source === targetId && edge.target === nodeId)
    .map((edge) => edge.targetHandle)

  const highlightedSourceHandles = edges
    .filter((edge) => edge.target === targetId && edge.source === nodeId)
    .map((edge) => edge.sourceHandle)

  return highlightedTargetHandles.concat(highlightedSourceHandles) || []
}

export const ERDContentInner: FC<Props> = ({
  nodes: _nodes,
  edges: _edges,
  enabledFeatures,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(_nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(_edges)
  const { relationships } = useDBStructureStore()
  const {
    state: { loading },
  } = useERDContentContext()
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)

  // useUpdateNodeCardinalities(nodes, relationships, setNodes)
  useInitialAutoLayout()
  useFitViewWhenActiveTableChange(
    enabledFeatures?.fitViewWhenActiveTableChange ?? true,
  )

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setActiveNodeId(nodeId)
      updateActiveTableName(nodeId)

      const { nodes: updatedNodes, edges: updatedEdges } =
        highlightNodesAndEdges(nodes, edges, nodeId)

      setEdges(updatedEdges)
      setNodes(updatedNodes)
    },
    [edges, nodes, setNodes, setEdges],
  )

  const handlePaneClick = useCallback(() => {
    setActiveNodeId(null)
    updateActiveTableName(undefined)

    const { nodes: updatedNodes, edges: updatedEdges } = highlightNodesAndEdges(
      nodes,
      edges,
      undefined,
    )

    setEdges(updatedEdges)
    setNodes(updatedNodes)
  }, [edges, nodes, setNodes, setEdges])

  const handleMouseEnterNode: NodeMouseHandler<Node> = useCallback(
    (_, { id }) => {
      const relatedEdges = edges.filter(
        (e) => e.source === id || e.target === id,
      )

      const relatedToActiveNodeEdges = edges.filter(
        (e) => e.source === activeNodeId || e.target === activeNodeId,
      )

      const updatedEdges = edges.map((e) => {
        if (relatedEdges.includes(e)) {
          return highlightEdge(e)
        }
        if (relatedToActiveNodeEdges.includes(e)) {
          return highlightEdge(e)
        }
        return unhighlightEdge(e)
      })

      const updatedNodes = nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, isHighlighted: true } }
        }

        const isRelated = isRelatedToTable(relationships, node.id, id)
        const isRelatedToActiveNode =
          activeNodeId && isRelatedToTable(relationships, node.id, activeNodeId)

        if (isRelated) {
          let highlightedHandles = getHighlightedHandles(edges, id, node.id)
          if (isRelatedToActiveNode) {
            highlightedHandles = highlightedHandles.concat(
              getHighlightedHandles(edges, activeNodeId, node.id),
            )
          }

          return {
            ...node,
            data: {
              ...node.data,
              isHighlighted: true,
              highlightedHandles: highlightedHandles,
            },
          }
        }
        if (isRelatedToActiveNode) {
          const highlightedHandles = getHighlightedHandles(
            edges,
            activeNodeId,
            node.id,
          ).concat(getHighlightedHandles(edges, id, node.id))

          const isHighlighted = node.id === activeNodeId

          return {
            ...node,
            data: {
              ...node.data,
              isHighlighted: isHighlighted,
              highlightedHandles: highlightedHandles,
            },
          }
        }

        return {
          ...node,
          data: {
            ...node.data,
            isHighlighted: false,
            highlightedHandles: [],
          },
        }
      })

      setEdges(updatedEdges)
      setNodes(updatedNodes)
    },
    [edges, nodes, setNodes, setEdges, relationships, activeNodeId],
  )

  const handleMouseLeaveNode: NodeMouseHandler<Node> = useCallback(
    (_, { id }) => {
      // If a node is active, do not remove the highlight
      if (activeNodeId) {
        const relatedEdges = edges.filter(
          (e) => e.source === activeNodeId || e.target === activeNodeId,
        )
        const updatedEdges = edges.map((e) =>
          relatedEdges.includes(e) ? highlightEdge(e) : unhighlightEdge(e),
        )
        setEdges(updatedEdges)

        const updatedNodes = nodes.map((node) => {
          const isRelated = isRelatedToTable(
            relationships,
            node.id,
            activeNodeId,
          )

          if (node.id === activeNodeId || isRelated) {
            const highlightedHandles = getHighlightedHandles(
              edges,
              activeNodeId,
              node.id,
            )

            const isHighlighted = node.id === activeNodeId

            return {
              ...node,
              data: {
                ...node.data,
                isHighlighted,
                highlightedHandles: highlightedHandles,
              },
            }
          }

          return {
            ...node,
            data: {
              ...node.data,
              isHighlighted: false,
              highlightedHandles: [],
            },
          }
        })

        setNodes(updatedNodes)
      } else {
        const updatedEdges = edges.map((e) =>
          e.source === id || e.target === id ? unhighlightEdge(e) : e,
        )
        setEdges(updatedEdges)

        const updatedNodes = nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            highlightedHandles: [],
            isHighlighted: false,
          },
        }))
        setNodes(updatedNodes)
      }
    },
    [edges, nodes, setNodes, setEdges, activeNodeId, relationships],
  )

  const panOnDrag = [1, 2]

  return (
    <div className={styles.wrapper} data-loading={loading}>
      {loading && <Spinner className={styles.loading} />}
      <ReactFlow
        nodes={nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            onClick: handleNodeClick,
          },
        }))}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.1}
        maxZoom={2}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => handleNodeClick(node.id)}
        onPaneClick={handlePaneClick}
        onNodeMouseEnter={handleMouseEnterNode}
        onNodeMouseLeave={handleMouseLeaveNode}
        panOnScroll
        panOnDrag={panOnDrag}
        selectionOnDrag
        deleteKeyCode={null} // Turn off because it does not want to be deleted
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

export const ERDContent: FC<Props> = ({ children, ...props }) => {
  return (
    <ERDContentProvider>
      <ERDContentInner {...props} />
      {children}
    </ERDContentProvider>
  )
}
