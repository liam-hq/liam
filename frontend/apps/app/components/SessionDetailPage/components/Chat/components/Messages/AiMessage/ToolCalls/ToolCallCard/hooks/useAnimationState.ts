import { useEffect, useState } from 'react'

type Status = 'pending' | 'running' | 'completed' | 'error'

export const useAnimationState = (status: Status, isPreCompleted: boolean) => {
  // For pre-completed content (initial load), start as ready immediately
  // For streaming content, wait for ArgumentsDisplay to be ready
  const [argumentsReady, setArgumentsReady] = useState(isPreCompleted)
  const [animationStarted, setAnimationStarted] = useState(false)
  const [argumentsAnimationComplete, setArgumentsAnimationComplete] =
    useState(isPreCompleted)

  useEffect(() => {
    if (status === 'pending' || status === 'running') {
      setAnimationStarted(true)
      setArgumentsAnimationComplete(false)
      // For streaming, argumentsReady will be set by onReady callback
    } else if (status === 'completed' && !animationStarted && !isPreCompleted) {
      // For immediate completion without animation
      setArgumentsReady(true)
      setArgumentsAnimationComplete(true)
    }
  }, [status, animationStarted, isPreCompleted])

  return {
    argumentsReady,
    setArgumentsReady,
    animationStarted,
    argumentsAnimationComplete,
    setArgumentsAnimationComplete,
  }
}
