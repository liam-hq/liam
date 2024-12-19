import { useDBStructureStore } from '@/stores'
import type { Relationships } from '@liam-hq/db-structure'
import {
  CardinalityZeroOrManyLeftMarker,
  CardinalityZeroOrOneLeftMarker,
  CardinalityZeroOrOneRightMarker,
} from '@liam-hq/ui'
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
import { type FC, useCallback, useState } from 'react'
import styles from './ERDContent.module.css'
import { ERDContentProvider, useERDContentContext } from './ERDContentContext'
import { RelationshipEdge } from './RelationshipEdge'
import { Spinner } from './Spinner'
import { TableNode } from './TableNode'
import { useFitViewWhenActiveTableChange } from './useFitViewWhenActiveTableChange'
import { useInitialAutoLayout } from './useInitialAutoLayout'

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

  useInitialAutoLayout()
  useFitViewWhenActiveTableChange(
    enabledFeatures?.fitViewWhenActiveTableChange ?? true,
  )

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setActiveNodeId(nodeId)

      const relatedEdges = edges.filter(
        (e) => e.source === nodeId || e.target === nodeId,
      )

      const updatedEdges = edges.map((e) =>
        relatedEdges.includes(e) ? highlightEdge(e) : unhighlightEdge(e),
      )

      const updatedNodes = nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, isHighlighted: true } }
        }

        const isRelated = isRelatedToTable(relationships, node.id, nodeId)

        if (isRelated) {
          const highlightedTargetHandles = relatedEdges
            .filter((edge) => edge.source === nodeId && edge.target === node.id)
            .map((edge) => edge.targetHandle)

          const highlightedSourceHandles = relatedEdges
            .filter((edge) => edge.target === nodeId && edge.source === node.id)
            .map((edge) => edge.sourceHandle)

          return {
            ...node,
            data: {
              ...node.data,
              isRelated: isRelated,
              highlightedHandles:
                highlightedTargetHandles.concat(highlightedSourceHandles) || [],
            },
          }
        }

        return {
          ...node,
          data: {
            ...node.data,
            isRelated: false,
            isHighlighted: false,
            highlightedHandles: [],
          },
        }
      })

      setEdges(updatedEdges)
      setNodes(updatedNodes)
    },
    [edges, nodes, setNodes, setEdges, relationships],
  )

  const handlePaneClick = useCallback(() => {
    setActiveNodeId(null)

    const updatedEdges = edges.map(unhighlightEdge)

    const updatedNodes = nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isRelated: false,
        highlightedHandles: [],
        isHighlighted: false,
      },
    }))

    setEdges(updatedEdges)
    setNodes(updatedNodes)
  }, [edges, nodes, setNodes, setEdges])

  const handleMouseEnterNode: NodeMouseHandler<Node> = useCallback(
    (_, { id }) => {
      const relatedEdges = edges.filter(
        (e) => e.source === id || e.target === id,
      )

      const updatedEdges = edges.map((e) =>
        relatedEdges.includes(e) ? highlightEdge(e) : e,
      )

      const updatedNodes = nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, isHighlighted: true } }
        }

        const isRelated = isRelatedToTable(relationships, node.id, id)

        if (isRelated) {
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
              isRelated: isRelated,
              highlightedHandles:
                highlightedTargetHandles.concat(highlightedSourceHandles) || [],
            },
          }
        }

        return node
      })

      setEdges(updatedEdges)
      setNodes(updatedNodes)
    },
    [edges, nodes, setNodes, setEdges, relationships],
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
            const highlightedTargetHandles = relatedEdges
              .filter(
                (edge) =>
                  edge.source === activeNodeId && edge.target === node.id,
              )
              .map((edge) => edge.targetHandle)

            const highlightedSourceHandles = relatedEdges
              .filter(
                (edge) =>
                  edge.target === activeNodeId && edge.source === node.id,
              )
              .map((edge) => edge.sourceHandle)

            const isHighlighted = node.id === activeNodeId

            return {
              ...node,
              data: {
                ...node.data,
                isRelated: isRelated,
                isHighlighted: isHighlighted,
                highlightedHandles:
                  highlightedTargetHandles.concat(highlightedSourceHandles) ||
                  [],
              },
            }
          }

          return {
            ...node,
            data: {
              ...node.data,
              isRelated: false,
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
            isRelated: false,
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
        <CardinalityZeroOrOneLeftMarker
          id="zeroOrOneLeft"
          color="var(--pane-border-hover)"
        />
        <CardinalityZeroOrOneLeftMarker
          id="zeroOrOneLeftHighlight"
          color="var(--node-layout)"
        />
        <CardinalityZeroOrOneRightMarker
          id="zeroOrOneRight"
          color="var(--pane-border-hover)"
        />
        <CardinalityZeroOrOneRightMarker
          id="zeroOrOneRightHighlight"
          color="var(--node-layout)"
        />
        <CardinalityZeroOrManyLeftMarker
          id="zeroOrManyLeft"
          color="var(--pane-border-hover)"
        />
        <CardinalityZeroOrManyLeftMarker
          id="zeroOrManyLeftHighlight"
          color="var(--node-layout)"
        />
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

export const ERDContent: FC<Props> = (props) => {
  return (
    <ERDContentProvider>
      <ERDContentInner {...props} />
    </ERDContentProvider>
  )
}
