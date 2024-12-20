import { selectTableLogEvent } from '@/features/gtm/utils'
import { repositionTableLogEvent } from '@/features/gtm/utils/repositionTableLogEvent'
import { useCliVersion } from '@/providers'
import { updateActiveTableName, useUserEditingActiveStore } from '@/stores'
import type { Relationships } from '@liam-hq/db-structure'
import {
  Background,
  BackgroundVariant,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type OnNodeDrag,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { type FC, useCallback } from 'react'
import { CardinalityMarkers } from './CardinalityMarkers'
import styles from './ERDContent.module.css'
import { ERDContentProvider, useERDContentContext } from './ERDContentContext'
import { NonRelatedTableGroupNode } from './NonRelatedTableGroupNode'
import { RelationshipEdge } from './RelationshipEdge'
import { Spinner } from './Spinner'
import { TableNode } from './TableNode'
import { highlightNodesAndEdges } from './highlightNodesAndEdges'
import { useFitViewWhenActiveTableChange } from './useFitViewWhenActiveTableChange'
import { useInitialAutoLayout } from './useInitialAutoLayout'
import { useSyncHiddenNodesChange } from './useSyncHiddenNodesChange'
import { useSyncHighlightsActiveTableChange } from './useSyncHighlightsActiveTableChange'

const nodeTypes = {
  table: TableNode,
  nonRelatedTableGroup: NonRelatedTableGroupNode,
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
  const {
    state: { loading },
  } = useERDContentContext()
  const { tableName: activeTableName } = useUserEditingActiveStore()

  useInitialAutoLayout(nodes)
  useFitViewWhenActiveTableChange(
    enabledFeatures?.fitViewWhenActiveTableChange ?? true,
  )
  useSyncHighlightsActiveTableChange()
  useSyncHiddenNodesChange()

  const { cliVersion } = useCliVersion()
  const handleNodeClick = useCallback(
    (tableId: string) => {
      updateActiveTableName(tableId)
      selectTableLogEvent({
        ref: 'mainArea',
        tableId,
        cliVer: cliVersion.version,
        appEnv: cliVersion.envName,
      })
    },
    [cliVersion.version, cliVersion.envName],
  )

  const handlePaneClick = useCallback(() => {
    updateActiveTableName(undefined)
  }, [])

  const handleMouseEnterNode: NodeMouseHandler<Node> = useCallback(
    (_, { id }) => {
      const { nodes: updatedNodes, edges: updatedEdges } =
        highlightNodesAndEdges(nodes, edges, {
          activeTableName,
          hoverTableName: id,
        })

      setEdges(updatedEdges)
      setNodes(updatedNodes)
    },
    [edges, nodes, setNodes, setEdges, activeTableName],
  )

  const handleMouseLeaveNode: NodeMouseHandler<Node> = useCallback(() => {
    const { nodes: updatedNodes, edges: updatedEdges } = highlightNodesAndEdges(
      nodes,
      edges,
      {
        activeTableName,
        hoverTableName: undefined,
      },
    )

    setEdges(updatedEdges)
    setNodes(updatedNodes)
  }, [edges, nodes, setNodes, setEdges, activeTableName])

  const handleDragStopNode: OnNodeDrag<Node> = useCallback(
    (_event, _node, nodes) => {
      const operationId = `id_${new Date().getTime()}`
      for (const node of nodes) {
        const tableId = node.id
        repositionTableLogEvent({
          tableId,
          operationId,
          cliVer: cliVersion.version,
          appEnv: cliVersion.envName,
        })
      }
    },
    [cliVersion.version, cliVersion.envName],
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
        onNodeDragStop={handleDragStopNode}
        panOnScroll
        panOnDrag={panOnDrag}
        selectionOnDrag
        deleteKeyCode={null} // Turn off because it does not want to be deleted
      >
        <CardinalityMarkers />
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
