import { useNodesContext } from '@/providers'
import type { QueryParam } from '@/schemas/queryParam'
import { addHiddenNodeIds, updateActiveTableName } from '@/stores'
import { decompressFromEncodedURIComponent } from '@/utils'
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

export const useInitialAutoLayout = (shouldFitViewToActiveTable: boolean) => {
  const { nodes, edges } = useNodesContext()

  const tableNodesInitialized = useMemo(
    () =>
      nodes
        .filter((node) => node.type === 'table')
        .some((node) => node.measured),
    [nodes],
  )

  const {
    state: { initializeComplete },
  } = useERDContentContext()
  const { handleLayout } = useAutoLayout()

  useEffect(() => {
    const initialize = async () => {
      if (initializeComplete || !tableNodesInitialized) {
        return
      }

      const activeTableName = getActiveTableNameFromUrl()
      updateActiveTableName(activeTableName)
      const hiddenNodeIds = await getHiddenNodeIdsFromUrl()
      addHiddenNodeIds(hiddenNodeIds)
      const hiddenNodes = nodes.map((node) => ({
        ...node,
        hidden: hiddenNodeIds.includes(node.id),
      }))
      const { nodes: updatedNodes, edges: updatedEdges } =
        highlightNodesAndEdges(hiddenNodes, edges, { activeTableName })

      const fitViewOptions =
        shouldFitViewToActiveTable && activeTableName
          ? { maxZoom: 1, duration: 300, nodes: [{ id: activeTableName }] }
          : undefined

      handleLayout(updatedNodes, updatedEdges, fitViewOptions)
    }

    initialize()
  }, [
    tableNodesInitialized,
    initializeComplete,
    handleLayout,
    nodes,
    edges,
    shouldFitViewToActiveTable,
  ])
}
