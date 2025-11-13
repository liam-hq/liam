import type { Node } from '@xyflow/react'
import { useCallback } from 'react'
import { useUserEditingOrThrow } from '../../../../stores'
import { useCustomReactflow } from '../../../reactflow/hooks'
import { updateNodesHiddenState } from '../../components/ERDContent/utils' // invalid import path
import type { TableNodeType } from '../../types'

export const useTableVisibility = (
  nodes: Node[],
  tableNodes: TableNodeType[],
) => {
  const allCount = tableNodes.length
  const visibleCount = tableNodes.filter((node) => !node.hidden).length

  const { setHiddenNodeIds, resetSelectedNodeIds } = useUserEditingOrThrow()
  const { setNodes } = useCustomReactflow()

  const showOrHideAllNodes = useCallback(() => {
    resetSelectedNodeIds()

    const shouldHide = visibleCount === allCount
    const updatedNodes = updateNodesHiddenState({
      nodes,
      hiddenNodeIds: shouldHide ? nodes.map((node) => node.id) : [],
      shouldHideGroupNodeId: true,
    })
    setNodes(updatedNodes)
    setHiddenNodeIds(shouldHide ? nodes.map((node) => node.id) : [])
  }, [
    nodes,
    visibleCount,
    allCount,
    setNodes,
    setHiddenNodeIds,
    resetSelectedNodeIds,
  ])

  return { showOrHideAllNodes }
}
