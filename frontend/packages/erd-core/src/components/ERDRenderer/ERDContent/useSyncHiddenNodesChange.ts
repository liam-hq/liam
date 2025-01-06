import { useUserEditingStore } from '@/stores'
import type { Node } from '@xyflow/react'
import { useEffect, useMemo } from 'react'
import { useNodesContext } from '../../../providers/NodesProvider'
import { NON_RELATED_TABLE_GROUP_NODE_ID } from '../convertDBStructureToNodes'
import { useERDContentContext } from './ERDContentContext'

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
  const { nodes, setNodes } = useNodesContext()
  const { hiddenNodeIds } = useUserEditingStore()

  const shouldUpdate = useMemo(() => {
    return nodes.some((node) => node.hidden !== hiddenNodeIds.has(node.id))
  }, [hiddenNodeIds, nodes])

  useEffect(() => {
    if (!initializeComplete || !shouldUpdate) {
      return
    }
    const updatedNodes: Node[] = nodes.map((node) => {
      const hidden = hiddenNodeIds.has(node.id)
      return { ...node, hidden }
    })
    const nonRelatedTableGroupNode = newNonRelatedTableGroupNode(updatedNodes)
    if (nonRelatedTableGroupNode !== undefined) {
      updatedNodes.push(nonRelatedTableGroupNode)
    }

    setNodes({
      type: 'UPDATE_HIDDEN',
      payload: updatedNodes,
    })
  }, [initializeComplete, shouldUpdate, nodes, setNodes, hiddenNodeIds])
}
