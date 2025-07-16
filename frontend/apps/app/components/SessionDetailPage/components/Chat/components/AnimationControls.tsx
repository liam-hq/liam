import { Button } from '@liam-hq/ui'
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
      <Button
        type="button"
        onClick={handlePlay}
        disabled={isPlaying}
        className={styles.button}
        aria-label={playButtonLabel}
        variant="outline-secondary"
        size="sm"
      >
        {isComplete ? 'Restart' : 'Start'}
      </Button>
      <Button
        type="button"
        onClick={pause}
        disabled={!isPlaying}
        className={styles.button}
        aria-label="Pause animation"
        variant="outline-secondary"
        size="sm"
      >
        Pause
      </Button>
      <Button
        type="button"
        onClick={reset}
        className={styles.button}
        aria-label="Reset animation to beginning"
        variant="outline-secondary"
        size="sm"
      >
        Reset
      </Button>
    </div>
  )
}
