import { useUserEditingStore } from '@/stores'
import { useReactFlow } from '@xyflow/react'
import { useEffect } from 'react'
import { useERDContentContext } from './ERDContentContext'

export const useSyncHiddenNodesChange = () => {
  const {
    state: { initializeComplete },
  } = useERDContentContext()
  const { getNodes, setNodes } = useReactFlow()
  const { hiddenNodeIds } = useUserEditingStore()

  useEffect(() => {
    if (!initializeComplete) {
      return
    }
    const nodes = getNodes()
    const updatedNodes = nodes.map((node) => {
      const hidden = hiddenNodeIds.has(node.id)
      return { ...node, hidden }
    })

    setNodes(updatedNodes)
  }, [initializeComplete, getNodes, setNodes, hiddenNodeIds])
}
