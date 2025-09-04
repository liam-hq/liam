import { useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'
import { useCustomReactflow } from '../../../../../reactflow/hooks'
import { computeAutoLayout } from '../../../../utils'

export const useFitScreen = () => {
  const { getNodes, getEdges, setNodes } = useReactFlow()
  const { fitView } = useCustomReactflow()

  const tidyUp = useCallback(async () => {
    const { nodes } = await computeAutoLayout(getNodes(), getEdges())
    setNodes(nodes)
    fitView()
  }, [getNodes, getEdges, setNodes, fitView])

  return { zoomToFit: fitView, tidyUp }
}
