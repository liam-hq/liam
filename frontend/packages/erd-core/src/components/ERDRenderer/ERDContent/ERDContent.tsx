import { selectTableLogEvent } from '@/features/gtm/utils'
import { repositionTableLogEvent } from '@/features/gtm/utils/repositionTableLogEvent'
import { useVersion } from '@/providers'
import { updateActiveTableName, useUserEditingActiveStore } from '@/stores'
import {
  Background,
  BackgroundVariant,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeMouseHandler,
  type OnNodeDrag,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  useEdgesState,
} from '@xyflow/react'
import { type FC, useCallback } from 'react'
import {
  NodesProvider,
  useNodesContext,
} from '../../../providers/NodesProvider'
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
  enabledFeatures?:
    | {
        fitViewWhenActiveTableChange?: boolean | undefined
        initialFitViewToActiveTable?: boolean | undefined
      }
    | undefined
}

export const ERDContentInner: FC<Props> = ({ enabledFeatures }) => {
  const { nodes, setNodes, edges, setEdges } = useNodesContext()
  const {
    state: { loading },
  } = useERDContentContext()
  const { tableName: activeTableName } = useUserEditingActiveStore()

  useInitialAutoLayout(enabledFeatures?.initialFitViewToActiveTable ?? true)
  useFitViewWhenActiveTableChange(
    enabledFeatures?.fitViewWhenActiveTableChange ?? true,
  )
  useSyncHighlightsActiveTableChange()
  useSyncHiddenNodesChange()

  console.log(nodes)
  const { version } = useVersion()
  const handleNodeClick = useCallback(
    (tableId: string) => {
      updateActiveTableName(tableId)
      version.displayedOn === 'cli' &&
        selectTableLogEvent({
          ref: 'mainArea',
          tableId,
          cliVer: version.version,
          appEnv: version.envName,
        })
    },
    [version],
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

      setEdges({
        type: 'UPDATE_EDGES',
        payload: updatedEdges,
      })
      setNodes({
        type: 'UPDATE_DATA',
        payload: updatedNodes,
      })
    },
    [edges, nodes, setNodes, setEdges, activeTableName],
  )

  const handleMouseLeaveNode: NodeMouseHandler<Node> = useCallback(() => {
    console.log('handleMouseLeaveNode')
    const { nodes: updatedNodes, edges: updatedEdges } = highlightNodesAndEdges(
      nodes,
      edges,
      {
        activeTableName,
        hoverTableName: undefined,
      },
    )

    setEdges({
      type: 'UPDATE_EDGES',
      payload: updatedEdges,
    })
    setNodes({
      type: 'UPDATE_DATA',
      payload: updatedNodes,
    })
  }, [edges, nodes, setNodes, setEdges, activeTableName])

  const handleDragStopNode: OnNodeDrag<Node> = useCallback(
    (_event, _node, nodes) => {
      const operationId = `id_${new Date().getTime()}`
      for (const node of nodes) {
        const tableId = node.id
        version.displayedOn === 'cli' &&
          repositionTableLogEvent({
            tableId,
            operationId,
            cliVer: version.version,
            appEnv: version.envName,
          })
      }
    },
    [version],
  )

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      setNodes({
        type: 'UPDATE_NODES',
        payload: applyNodeChanges(changes, nodes),
      })
    },
    [setNodes, nodes],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges({
        type: 'UPDATE_EDGES',
        payload: applyEdgeChanges(changes, edges),
      })
    },
    [setEdges, edges],
  )

  const panOnDrag = [1, 2]

  return (
    <div className={styles.wrapper} data-loading={loading}>
      {loading && <Spinner className={styles.loading} />}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        edgesFocusable={false}
        edgesReconnectable={false}
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
