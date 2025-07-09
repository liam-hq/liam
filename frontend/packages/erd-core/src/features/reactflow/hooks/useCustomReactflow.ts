import { useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'
import { MAX_ZOOM, MIN_ZOOM } from '../constants'

export const useCustomReactflow = () => {
  const reactFlowInstance = useReactFlow()
  const { fitView: primitiveFitView, ...restFunctions } = reactFlowInstance

  const fitView = useCallback(
    async (options = {}) => {
      // Use a more reliable timing approach that works in both browser and test environments
      // This ensures UI updates complete before calling fitView
      await new Promise((resolve) => {
        // Use setTimeout with minimal delay for better test compatibility
        setTimeout(resolve, 50)
      })

      primitiveFitView({
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        ...options,
      })
    },
    [primitiveFitView],
  )

  return {
    ...restFunctions,
    fitView,
  }
}
