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
import { useVersionOrThrow } from '../../../../providers'
import { useUserEditingOrThrow } from '../../../../stores'
import { selectTableLogEvent } from '../../../gtm/utils'
import { repositionTableLogEvent } from '../../../gtm/utils/repositionTableLogEvent'
import { MAX_ZOOM, MIN_ZOOM } from '../../../reactflow/constants'
import { useTableSelection } from '../../hooks'
import type { DisplayArea } from '../../types'
import { highlightNodesAndEdges, isTableNode } from '../../utils'
import {
  NonRelatedTableGroupNode,
  RelationshipEdge,
  Spinner,
  TableNode,
} from './components'
import styles from './ERDContent.module.css'
import { ErdContentProvider, useErdContentContext } from './ErdContentContext'
import { useInitialAutoLayout, useQueryParamsChanged } from './hooks'

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
  displayArea: DisplayArea
}

export const ERDContentInner: FC<Props> = ({
  nodes: _nodes,
  edges: _edges,
  displayArea,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(
    displayArea === 'relatedTables'
      ? _nodes.map((node) =>
          isTableNode(node)
            ? { ...node, data: { ...node.data, showMode: 'TABLE_NAME' } }
            : node,
        )
      : _nodes,
  )

  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(_edges)
  const {
    state: { loading },
  } = useErdContentContext()
  const { activeTableName } = useUserEditingOrThrow()

  const { selectTable, deselectTable } = useTableSelection()

  useInitialAutoLayout({
    nodes,
    displayArea,
  })
  useQueryParamsChanged({
    displayArea,
  })

  const { version } = useVersionOrThrow()
  const handleNodeClick = useCallback(
    (tableId: string) => {
      selectTable({
        tableId,
        displayArea,
      })

      selectTableLogEvent({
        ref: 'mainArea',
        tableId,
        platform: version.displayedOn,
        gitHash: version.gitHash,
        ver: version.version,
        appEnv: version.envName,
      })
    },
    [version, displayArea, selectTable],
  )

  const handlePaneClick = useCallback(() => {
    deselectTable()
  }, [deselectTable])

  const handleMouseEnterNode: NodeMouseHandler<Node> = useCallback(
    (_, { id }) => {
      const { nodes: updatedNodes, edges: updatedEdges } =
        highlightNodesAndEdges(nodes, edges, {
          activeTableName: activeTableName ?? undefined,
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
        activeTableName: activeTableName ?? undefined,
        hoverTableName: undefined,
      },
    )

    setEdges(updatedEdges)
    setNodes(updatedNodes)
  }, [edges, nodes, setNodes, setEdges, activeTableName])

  const handleDragStopNode: OnNodeDrag<Node> = useCallback(
    (_event, _node, nodes) => {
      const operationId = `id_${Date.now()}`
      for (const node of nodes) {
        const tableId = node.id
        repositionTableLogEvent({
          tableId,
          operationId,
          platform: version.displayedOn,
          gitHash: version.gitHash,
          ver: version.version,
          appEnv: version.envName,
        })
      }
    },
    [version],
  )

  const panOnDrag = [1, 2]

  return (
    <div className={styles.wrapper} data-loading={loading}>
      {loading && <Spinner className={styles.loading} />}
      <ReactFlow
        colorMode="dark"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        edgesFocusable={false}
        edgesReconnectable={false}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => handleNodeClick(node.id)}
        onPaneClick={handlePaneClick}
        onNodeMouseEnter={handleMouseEnterNode}
        onNodeMouseLeave={handleMouseLeaveNode}
        onNodeDragStop={handleDragStopNode}
        panOnScroll
        panOnDrag={panOnDrag}
        deleteKeyCode={null} // Turn off because it does not want to be deleted
        attributionPosition="bottom-left"
        nodesConnectable={false}
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
    <ErdContentProvider>
      <ERDContentInner {...props} />
    </ErdContentProvider>
  )
}
