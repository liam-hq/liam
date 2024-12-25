import type { QueryParam } from '@/schemas/queryParam'
import { addHiddenNodeIds, updateActiveTableName } from '@/stores'
import { decompressFromEncodedURIComponent } from '@/utils'
import { type Node, useReactFlow } from '@xyflow/react'
import { useEffect, useMemo } from 'react'
import { useERDContentContext } from './ERDContentContext'
import { highlightNodesAndEdges } from './highlightNodesAndEdges'
import { useAutoLayout } from './useAutoLayout'

const getActiveTableNameFromUrl = (): string | undefined => {
  const urlParams = new URLSearchParams(window.location.search)
  const activeQueryParam: QueryParam = 'active'
  const tableName = urlParams.get(activeQueryParam)

  return tableName || undefined
}

const getHiddenNodeIdsFromUrl = async (): Promise<string[]> => {
  const urlParams = new URLSearchParams(window.location.search)
  const hiddenQueryParam: QueryParam = 'hidden'
  const compressed = urlParams.get(hiddenQueryParam)
  const hiddenNodeIds = compressed
    ? await decompressFromEncodedURIComponent(compressed).catch(() => undefined)
    : undefined

  return hiddenNodeIds ? hiddenNodeIds.split(',') : []
}

export const useInitialAutoLayout = (nodes: Node[]) => {
  console.info(
    'useInitialAutoLayout - func called',
    new Date().toISOString().slice(11, -1),
    nodes[1]?.position,
  )

  const tableNodesInitialized = useMemo(
    () =>
      nodes
        .filter((node) => node.type === 'table')
        .some((node) => node.measured),
    [nodes],
  )
  const { getEdges } = useReactFlow()

  const {
    state: { initializeComplete },
  } = useERDContentContext()
  const { handleLayout } = useAutoLayout()

  useEffect(() => {
    console.info(
      'useInitialAutoLayout - start',
      new Date().toISOString().slice(11, -1),
      tableNodesInitialized,
      initializeComplete,
      nodes.length,
    )
    const initialize = async () => {
      if (initializeComplete) {
        return
      }

      const activeTableName = getActiveTableNameFromUrl()
      updateActiveTableName(activeTableName)
      const hiddenNodeIds = await getHiddenNodeIdsFromUrl()
      addHiddenNodeIds(hiddenNodeIds)
      const edges = getEdges()
      const hiddenNodes = nodes.map((node) => ({
        ...node,
        hidden: hiddenNodeIds.includes(node.id),
      }))
      const { nodes: updatedNodes, edges: updatedEdges } =
        highlightNodesAndEdges(hiddenNodes, edges, { activeTableName })

      const fitViewOptions = activeTableName
        ? { maxZoom: 1, duration: 300, nodes: [{ id: activeTableName }] }
        : undefined

      if (tableNodesInitialized) {
        handleLayout(updatedNodes, updatedEdges, fitViewOptions)
        console.info(
          'useInitialAutoLayout - tableNodesInitialized',
          new Date().toISOString().slice(11, -1),
          tableNodesInitialized,
          initializeComplete,
        )
      }
    }

    initialize()
    console.info(
      'useInitialAutoLayout - finish',
      new Date().toISOString().slice(11, -1),
      tableNodesInitialized,
      initializeComplete,
      nodes.length,
    )
  }, [tableNodesInitialized, initializeComplete, handleLayout, nodes, getEdges])
}
