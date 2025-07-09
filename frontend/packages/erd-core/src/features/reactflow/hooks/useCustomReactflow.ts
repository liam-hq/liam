import { type FitViewOptions, useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'
import { MAX_ZOOM, MIN_ZOOM } from '../constants'

export const useCustomReactflow = () => {
  const reactFlowInstance = useReactFlow()
  const { fitView: primitiveFitView, ...restFunctions } = reactFlowInstance

  const fitView = useCallback(
    async (options?: FitViewOptions) => {
      // Enhanced timing strategy for React Flow v12.5+ and E2E tests
      return new Promise<void>((resolve) => {
        const executeFitView = () => {
          primitiveFitView({
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            ...options,
          })
          resolve()
        }

        // Use multiple timing strategies for maximum compatibility
        if (typeof window !== 'undefined') {
          // Browser environment - use requestAnimationFrame
          requestAnimationFrame(() => {
            setTimeout(executeFitView, 20)
          })
        } else {
          // Test environment - use setTimeout with longer delay
          setTimeout(executeFitView, 100)
        }
      })
    },
    [primitiveFitView],
  )

  return {
    ...restFunctions,
    fitView,
  }
}
