import { useEffect, useState } from 'react'
import type {
  AnimationActions,
  AnimationState,
} from '../hooks/useAnimationState'
import styles from './AnimationControls.module.css'

type AnimationControlsProps = {
  state: AnimationState
  actions: AnimationActions
  agentStepsLength: number
  mockTimelineItemsLength: number
}

export const AnimationControls = ({
  state,
  actions,
  agentStepsLength,
  mockTimelineItemsLength,
}: AnimationControlsProps) => {
  const { currentStep, currentIndex, isPlaying } = state
  const { play, pause, reset, setCurrentStep, setCurrentIndex } = actions
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const isComplete =
    currentStep >= agentStepsLength && currentIndex >= mockTimelineItemsLength
  const playButtonLabel = isComplete
    ? 'Restart animation from beginning'
    : 'Start animation'

  const handlePlay = () => {
    if (prefersReducedMotion) {
      // Skip to the end state if user prefers reduced motion
      setCurrentStep(agentStepsLength)
      setCurrentIndex(mockTimelineItemsLength)
    } else {
      play()
    }
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        onClick={handlePlay}
        disabled={isPlaying}
        className={styles.button}
        aria-label={playButtonLabel}
      >
        {isComplete ? 'Restart' : 'Start'}
      </button>
      <button
        type="button"
        onClick={pause}
        disabled={!isPlaying}
        className={styles.button}
        aria-label="Pause animation"
      >
        Pause
      </button>
      <button
        type="button"
        onClick={reset}
        className={styles.button}
        aria-label="Reset animation to beginning"
      >
        Reset
      </button>
    </div>
  )
}
