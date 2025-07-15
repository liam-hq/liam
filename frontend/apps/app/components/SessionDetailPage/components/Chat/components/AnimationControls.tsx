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
  const { play, pause, reset } = actions

  return (
    <div className={styles.container}>
      <button
        type="button"
        onClick={play}
        disabled={isPlaying}
        className={styles.button}
      >
        {currentStep >= agentStepsLength &&
        currentIndex >= mockTimelineItemsLength
          ? 'Restart'
          : 'Start'}
      </button>
      <button
        type="button"
        onClick={pause}
        disabled={!isPlaying}
        className={styles.button}
      >
        Pause
      </button>
      <button type="button" onClick={reset} className={styles.button}>
        Reset
      </button>
    </div>
  )
}
