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

      console.info(
        'useAutoLayout - setNodes',
        new Date().toISOString().slice(11, -1),
      )
      setNodes([...hiddenNodes, ...newNodes])
      window.requestAnimationFrame(() => {
        console.info(
          'window.requestAnimationFrame 1 - top',
          new Date().toISOString().slice(11, -1),
        )
        fitView(fitViewOptions)
        window.requestAnimationFrame(() => {
          console.info(
            'window.requestAnimationFrame 2 - top',
            new Date().toISOString().slice(11, -1),
          )
          console.info(
            'setLoading false',
            new Date().toISOString().slice(11, -1),
          )
          setLoading(false)
          setInitializeComplete(true)
          console.info(
            'window.requestAnimationFrame 2 - bottom',
            new Date().toISOString().slice(11, -1),
          )
        })
        console.info(
          'window.requestAnimationFrame 1 - bottom',
          new Date().toISOString().slice(11, -1),
        )
      })
    },
    [setNodes, fitView, setLoading, setInitializeComplete],
  )

  return { handleLayout }
}
