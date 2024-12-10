import { type Node, useNodesInitialized, useReactFlow } from '@xyflow/react'
import {
  type SimulationLinkDatum,
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

    const simulationNodes: SimNodeType[] = nodes.map((node) => ({
      ...node,
      x: node.position.x,
      y: node.position.y,
    }))

    const simulationLinks: SimulationLinkDatum<SimNodeType>[] = edges.map(
      (edge) => edge,
    )

    const simulation = forceSimulation()
      .nodes(simulationNodes)
      .force('charge', forceManyBody().strength(-20000))
      .force(
        'link',
        forceLink(simulationLinks)
          .id((d) => d.id)
          .strength(0.01)
          .distance(20),
      )
      .force('x', forceX(20).x(0).strength(0.1))
      .force('y', forceY(20).y(0).strength(0.1))
      .on('tick', () => {
        setNodes((nodes) =>
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

        setTimeout(() => fitView(), 0)
      })

    return () => {
      simulation.stop()
    }
  }, [nodesInitialized, getNodes, setNodes, getEdges, fitView])
}
