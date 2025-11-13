import { useNodes } from '@xyflow/react'
import { useCallback, useMemo } from 'react'
import { useUserEditingOrThrow } from '../../../../stores'
import { useCustomReactflow } from '../../../reactflow/hooks'
import { updateNodesHiddenState } from '../../components/ERDContent/utils' // invalid import path
import { isTableNode } from '../../utils';

export const useTableVisibility = () => {
  const nodes = useNodes()

  const visibilityStatus: 'all-hidden' | 'all-visible' | 'partially-visible' = useMemo(() => {
    const tableNodes = nodes.filter((node) => isTableNode(node))
    const visibleTableNodes = tableNodes.filter((node) => !node.hidden)

    if (visibleTableNodes.length === 0) {
      return 'all-hidden'
    } else if (visibleTableNodes.length === tableNodes.length) {
      return 'all-visible'
    }

    return 'partially-visible'
  }, [nodes])


  const { setHiddenNodeIds, resetSelectedNodeIds } = useUserEditingOrThrow()
  const { setNodes } = useCustomReactflow()

  const updateVisibility = useCallback(
    (hiddenNodeIds: string[]) => {
      const updatedNodes = updateNodesHiddenState({
        nodes,
        hiddenNodeIds: hiddenNodeIds,
        shouldHideGroupNodeId: true,
      })
      setNodes(updatedNodes)
      setHiddenNodeIds(hiddenNodeIds)
    },
    [nodes, setNodes, setHiddenNodeIds],
  )

  const showAllNodes = useCallback(() => {
    resetSelectedNodeIds()
    updateVisibility([])
  }, [resetSelectedNodeIds, updateVisibility]);

  const hideAllNodes = useCallback(() => {
    resetSelectedNodeIds()
    updateVisibility(nodes.map((node) => node.id))
  }, [resetSelectedNodeIds, updateVisibility]);

  return { visibilityStatus, showAllNodes, hideAllNodes }
}
