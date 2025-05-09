import { type FC, useCallback } from 'react'
import { ERDContent } from '@liam-hq/erd-core'
import { ERDContentProvider } from '@liam-hq/erd-core/src/features/erd/components/ERDContent/ERDContentContext'
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
import type { TableGroup } from '@liam-hq/db-structure'
import type { DisplayArea } from '@liam-hq/erd-core/src/features/erd/types'
import { ChatNode } from '../ChatNode'
import { ChatInputNode } from '../ChatInputNode'
import clsx from 'clsx'
import { useTableSelection } from '@liam-hq/erd-core/src/features/erd/hooks'
import { useVersion } from '@liam-hq/erd-core/src/providers'
import { useUserEditingActiveStore, useUserEditingStore } from '@liam-hq/erd-core/src/stores'
import { highlightNodesAndEdges, isTableNode } from '@liam-hq/erd-core/src/features/erd/utils'
import { selectTableLogEvent, repositionTableLogEvent } from '@liam-hq/erd-core/src/features/gtm/utils'
import { MAX_ZOOM, MIN_ZOOM } from '@liam-hq/erd-core/src/features/reactflow/constants'
import { useERDContentContext } from '@liam-hq/erd-core/src/features/erd/components/ERDContent/ERDContentContext'
import { useInitialAutoLayout, usePopStateListener } from '@liam-hq/erd-core/src/features/erd/components/ERDContent/hooks'
import { useTableGroupBoundingBox } from '@liam-hq/erd-core/src/features/erd/components/ERDContent/hooks/useTableGroupBoundingBox'
import {
  NonRelatedTableGroupNode,
  RelationshipEdge,
  Spinner,
  TableGroupBoundingBox,
  TableGroupNode,
  TableNode,
} from '@liam-hq/erd-core/src/features/erd/components/ERDContent/components'
import styles from '@liam-hq/erd-core/src/features/erd/components/ERDContent/ERDContent.module.css'

// Custom node types to extend the default ones
const nodeTypes = {
  table: TableNode,
  nonRelatedTableGroup: NonRelatedTableGroupNode,
  tableGroup: TableGroupNode,
  chat: ChatNode,
  chatInput: ChatInputNode,
}

const edgeTypes = {
  relationship: RelationshipEdge,
}

interface CustomERDContentProps {
  nodes: Node[]
  edges: Edge[]
  displayArea: DisplayArea
  onAddTableGroup?: ((props: TableGroup) => void) | undefined
}

// This is a copy of ERDContentInner with our custom node types
const CustomERDContentInner: FC<CustomERDContentProps> = ({
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
  const { isTableGroupEditMode } = useUserEditingStore()
  const { tableName: activeTableName } = useUserEditingActiveStore()

  const { selectTable, deselectTable } = useTableSelection()

  useInitialAutoLayout({
    nodes,
    displayArea,
  })
  usePopStateListener({ displayArea })

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
        nodeTypes={nodeTypes} // Use our custom node types
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

export const CustomERDContent: FC<CustomERDContentProps> = (props) => {
  return (
    <ERDContentProvider>
      <CustomERDContentInner {...props} />
    </ERDContentProvider>
  )
}
