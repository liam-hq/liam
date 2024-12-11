import { type Node, useNodesInitialized, useReactFlow } from '@xyflow/react'
import {
  type SimulationNodeDatum,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from 'd3-force'
import { useEffect } from 'react'

type SimNodeType = SimulationNodeDatum & Node

export function useForceLayout() {
  const nodesInitialized = useNodesInitialized()
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow()

  useEffect(() => {
    const nodes = getNodes()
    const edges = getEdges()

    if (!nodes.length || !nodesInitialized) {
      return
    }

    const simulationNodes: SimNodeType[] = [...nodes].map((node) => ({
      ...node,
      x: node.position.x,
      y: node.position.y,
    }))

    const simulationLinks = [...edges]

    const simulation = forceSimulation(simulationNodes)
      .force('charge', forceManyBody().strength(-8000))
      .force('x', forceX().x(0).strength(0.08))
      .force('y', forceY().y(0).strength(0.08))
      .force(
        'link',
        forceLink(simulationLinks)
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          .id((d: any) => d.id)
          .strength(0.95)
          .distance(500),
      )
      .on('tick', () => {
        setNodes(
          nodes.map((node, i) => {
            const simulationNode = simulationNodes[i]

            return {
              ...node,
              position: {
                x: simulationNode?.x ?? 0,
                y: simulationNode?.y ?? 0,
              },
              style: {
                opacity: 1,
              },
            }
          }),
        )
      })
      .on('end', () => {
        setTimeout(() => fitView(), 0)
      })

    return () => {
      simulation.stop()
    }
  }, [nodesInitialized, getNodes, setNodes, getEdges, fitView])
}
