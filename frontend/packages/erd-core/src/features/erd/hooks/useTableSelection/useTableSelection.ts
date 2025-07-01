import { useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'
import { useUserEditing } from '@/stores'
import type { DisplayArea } from '../../types'
import { highlightNodesAndEdges } from '../../utils'

type SelectTableParams = {
  tableId: string
  displayArea: DisplayArea
}

export const useTableSelection = () => {
  const { setActiveTableName } = useUserEditing()
  const { getNodes, getEdges, setNodes, setEdges, fitView } = useReactFlow()

  const selectTable = useCallback(
    async ({ tableId, displayArea }: SelectTableParams) => {
      setActiveTableName(tableId)

      const { nodes, edges } = highlightNodesAndEdges(getNodes(), getEdges(), {
        activeTableName: tableId,
      })

      setNodes(nodes)
      setEdges(edges)

      if (displayArea === 'main') {
        requestAnimationFrame(() => {
          fitView({
            maxZoom: 1,
            duration: 300,
            nodes: [{ id: tableId }],
          })
        })
      }
    },
    [getNodes, getEdges, setNodes, setEdges, fitView, setActiveTableName],
  )

  const deselectTable = useCallback(() => {
    setActiveTableName(null)

    const { nodes, edges } = highlightNodesAndEdges(getNodes(), getEdges(), {
      activeTableName: undefined,
    })
    setNodes(nodes)
    setEdges(edges)
  }, [setActiveTableName, getNodes, getEdges, setNodes, setEdges])

  return {
    selectTable,
    deselectTable,
  }
}
