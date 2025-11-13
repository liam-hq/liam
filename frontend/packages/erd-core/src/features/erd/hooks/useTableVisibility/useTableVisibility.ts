import { useNodes } from '@xyflow/react'
import { useCallback } from 'react'
import { useUserEditingOrThrow } from '../../../../stores'
import { useCustomReactflow } from '../../../reactflow/hooks'
import { updateNodesHiddenState } from '../../components/ERDContent/utils' // invalid import path

export const useTableVisibility = () => {
  const nodes = useNodes()
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

  return { showAllNodes, hideAllNodes }
}
