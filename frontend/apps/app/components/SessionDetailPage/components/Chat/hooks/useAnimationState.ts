import { useState } from 'react'

const MAX_RETRY_INDEX = 10
const RETRY_START_INDEX = 8

export type AnimationState = {
  currentIndex: number
  isPlaying: boolean
  currentStep: number
}

export type AnimationActions = {
  setCurrentIndex: (index: number | ((prev: number) => number)) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentStep: (step: number | ((prev: number) => number)) => void
  play: () => void
  pause: () => void
  reset: () => void
  handleRetry: () => void
}

export const useAnimationState = (
  agentStepsLength: number,
): AnimationState & AnimationActions => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const play = () => {
    if (currentStep >= agentStepsLength) {
      setCurrentStep(0)
      setCurrentIndex(0)
    }
    setIsPlaying(true)
  }

  const pause = () => setIsPlaying(false)

  const reset = () => {
    setCurrentStep(0)
    setCurrentIndex(0)
    setIsPlaying(false)
  }

  const handleRetry = () => {
    if (currentStep >= agentStepsLength && currentIndex < MAX_RETRY_INDEX) {
      setCurrentIndex(RETRY_START_INDEX)
      setIsPlaying(true)
    }
  }

  return {
    currentIndex,
    isPlaying,
    currentStep,
    setCurrentIndex,
    setIsPlaying,
    setCurrentStep,
    play,
    pause,
    reset,
    handleRetry,
  }
}
