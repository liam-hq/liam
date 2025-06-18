import type { TableGroup } from '@liam-hq/db-structure'
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
import clsx from 'clsx'
import { type FC, useCallback } from 'react'
import { useTableSelection } from '@/features/erd/hooks'
import type { DisplayArea } from '@/features/erd/types'
import { selectTableLogEvent } from '@/features/gtm/utils'
import { repositionTableLogEvent } from '@/features/gtm/utils/repositionTableLogEvent'
import { MAX_ZOOM, MIN_ZOOM } from '@/features/reactflow/constants'
import { useVersion } from '@/providers'
import { useUserEditing } from '@/stores'
import { highlightNodesAndEdges, isTableNode } from '../../utils'
import {
  NonRelatedTableGroupNode,
  RelationshipEdge,
  Spinner,
  TableGroupBoundingBox,
  TableGroupNode,
  TableNode,
} from './components'
import styles from './ERDContent.module.css'
import { ERDContentProvider, useERDContentContext } from './ERDContentContext'
import { useInitialAutoLayout, useQueryParamsChanged } from './hooks'
import { useTableGroupBoundingBox } from './hooks/useTableGroupBoundingBox'

const nodeTypes = {
  table: TableNode,
  nonRelatedTableGroup: NonRelatedTableGroupNode,
  tableGroup: TableGroupNode,
}

const edgeTypes = {
  relationship: RelationshipEdge,
}

type Props = {
  nodes: Node[]
  edges: Edge[]
  displayArea: DisplayArea
  onAddTableGroup?: ((props: TableGroup) => void) | undefined
}

export const ERDContentInner: FC<Props> = ({
  nodes: _nodes,
  edges: _edges,
  displayArea,
  onAddTableGroup,
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
  } = useERDContentContext()
  const { activeTableName, isTableGroupEditMode } = useUserEditing()

  const { selectTable, deselectTable } = useTableSelection()

  useInitialAutoLayout({
    nodes,
    displayArea,
  })
  useQueryParamsChanged({
    displayArea,
  })

  const {
    containerRef,
    currentBox,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useTableGroupBoundingBox({
    nodes,
    onAddTableGroup,
  })

  const { version } = useVersion()
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
      const operationId = `id_${new Date().getTime()}`
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
    <div
      className={clsx(
        styles.wrapper,
        isTableGroupEditMode && styles.groupEditMode,
      )}
      data-loading={loading}
    >
      {loading && <Spinner className={styles.loading} />}
      <ReactFlow
        ref={containerRef}
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
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
        {currentBox && (
          <TableGroupBoundingBox
            left={Math.min(currentBox.x, currentBox.x + currentBox.width)}
            top={Math.min(currentBox.y, currentBox.y + currentBox.height)}
            width={Math.abs(currentBox.width)}
            height={Math.abs(currentBox.height)}
          />
        )}
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
