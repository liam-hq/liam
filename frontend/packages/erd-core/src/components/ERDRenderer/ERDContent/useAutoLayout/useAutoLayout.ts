import { useReactFlow } from '@xyflow/react'
import type { Edge, FitViewOptions, Node } from '@xyflow/react'
import { useCallback } from 'react'
import { useERDContentContext } from '../ERDContentContext'
import { getElkLayout } from './getElkLayout'

export const useAutoLayout = () => {
  const { setNodes, fitView } = useReactFlow()
  const {
    actions: { setLoading, setInitializeComplete },
  } = useERDContentContext()

  const handleLayout = useCallback(
    async (
      nodes: Node[],
      edges: Edge[],
      fitViewOptions: FitViewOptions = {},
    ) => {
      setLoading(true)
      const hiddenNodes: Node[] = []
      const visibleNodes: Node[] = []
      for (const node of nodes) {
        if (node.hidden) {
          hiddenNodes.push(node)
        } else {
          visibleNodes.push(node)
        }
      }

      // NOTE: Only include edges where both the source and target are in the nodes
      const nodeMap = new Map(visibleNodes.map((node) => [node.id, node]))
      const visibleEdges = edges.filter((edge) => {
        return nodeMap.get(edge.source) && nodeMap.get(edge.target)
      })

      const newNodes = await getElkLayout({
        nodes: visibleNodes,
        edges: visibleEdges,
      })

      setNodes([...hiddenNodes, ...newNodes])
      setTimeout(() => {
        window.requestAnimationFrame(() => {
          console.info('setLoading(false) start')
          setLoading(false)
          window.requestAnimationFrame(() => {
            console.info('setInitializeComplete(true) start')
            setInitializeComplete(true)

            window.requestAnimationFrame(() => {
              console.info('calling fitView start')
              fitView(fitViewOptions)
            })
          })
        })
      }, 0)
    },
    [setNodes, fitView, setLoading, setInitializeComplete],
  )

  return { handleLayout }
}
