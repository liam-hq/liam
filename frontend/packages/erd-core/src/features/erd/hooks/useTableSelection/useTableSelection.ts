import { useCallback } from 'react'
import { useUserEditingOrThrow } from '../../../../stores'
import { useCustomReactflow } from '../../../reactflow/hooks'
import type { DisplayArea } from '../../types'
import { highlightNodesAndEdges } from '../../utils'

type SelectTableParams = {
  tableId: string
  displayArea: DisplayArea
  columnName?: string | null
}

export const useTableSelection = () => {
  const { setActiveTableName, setHash } = useUserEditingOrThrow()

  const { getNodes, getEdges, setNodes, setEdges, fitView } =
    useCustomReactflow()

  const selectTable = useCallback(
    async ({ tableId, displayArea, columnName }: SelectTableParams) => {
      setActiveTableName(tableId)
      // setHash(columnName ? `${tableId}__column__${}`null)

      const { nodes, edges } = highlightNodesAndEdges(getNodes(), getEdges(), {
        activeTableName: tableId,
      })

      setNodes(nodes)
      setEdges(edges)

      if (displayArea === 'main') {
        await fitView({
          maxZoom: 1,
          duration: 300,
          nodes: [{ id: tableId }],
        })
      }
    },
    [
      getNodes,
      getEdges,
      setNodes,
      setEdges,
      fitView,
      setActiveTableName,
      setHash,
    ],
  )

  const deselectTable = useCallback(() => {
    setActiveTableName(null)
    setHash(null)

    const { nodes, edges } = highlightNodesAndEdges(getNodes(), getEdges(), {
      activeTableName: undefined,
    })
    setNodes(nodes)
    setEdges(edges)
  }, [setActiveTableName, setHash, getNodes, getEdges, setNodes, setEdges])

  return {
    selectTable,
    deselectTable,
  }
}
