import { type FitViewOptions, useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'
import { MAX_ZOOM, MIN_ZOOM } from '../constants'

export const useCustomReactflow = () => {
  const reactFlowInstance = useReactFlow()

  const fitView = useCallback(
    (options?: FitViewOptions) => {
      reactFlowInstance.fitView({
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        ...options,
      })
    },
    [reactFlowInstance],
  )

  return {
    ...reactFlowInstance,
    fitView,
  }
}
