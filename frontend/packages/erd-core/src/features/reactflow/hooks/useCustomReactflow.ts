import { type FitViewOptions, useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'
import { MAX_ZOOM, MIN_ZOOM } from '../constants'

export const useCustomReactflow = () => {
  const reactFlowInstance = useReactFlow()
  const { fitView: primitiveFitView, ...restFunctions } = reactFlowInstance

  const fitView = useCallback(
    async (options?: FitViewOptions) => {
      // Allow layout to settle before calling fitView
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            primitiveFitView({
              padding: 0.1, // default padding of 10%, can override via options
              minZoom: MIN_ZOOM,
              maxZoom: MAX_ZOOM,
              includeHiddenNodes: false,
              ...options,
            })
            resolve()
          }, 0) // micro delay after frame to ensure DOM is updated
        })
      })
    },
    [primitiveFitView],
  )

  return {
    ...restFunctions,
    fitView,
  }
}
