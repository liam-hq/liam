import { useUserEditingStore } from '@/stores'
import { type Node, useReactFlow } from '@xyflow/react'
import { useEffect } from 'react'
import { NON_RELATED_TABLE_GROUP_NODE_ID } from '../convertDBStructureToNodes'
import { useERDContentContext } from './ERDContentContext'
import { useAutoLayout } from './useAutoLayout'

const newNonRelatedTableGroupNode = (nodes: Node[]): Node | undefined => {
  const node = nodes.find((node) => node.id === NON_RELATED_TABLE_GROUP_NODE_ID)

  if (!node) {
    return
  }

  const visible = nodes
    .filter((node) => node.parentId === NON_RELATED_TABLE_GROUP_NODE_ID)
    .some((node) => !node.hidden)

  return { ...node, hidden: !visible }
}

export const useSyncHiddenNodesChange = () => {
  const {
    state: { initializeComplete },
  } = useERDContentContext()
  const { getNodes, getEdges } = useReactFlow()
  const { handleLayout } = useAutoLayout()
  const { hiddenNodeIds } = useUserEditingStore()

  useEffect(() => {
    if (!initializeComplete) {
      return
    }
    const nodes = getNodes()
    const updatedNodes: Node[] = nodes.map((node) => {
      const hidden = hiddenNodeIds.has(node.id)
      return { ...node, hidden }
    })
    const nonRelatedTableGroupNode = newNonRelatedTableGroupNode(updatedNodes)
    if (nonRelatedTableGroupNode !== undefined) {
      updatedNodes.push(nonRelatedTableGroupNode)
    }

    handleLayout(updatedNodes, getEdges())
  }, [initializeComplete, getNodes, getEdges, handleLayout, hiddenNodeIds])
}
