import type { Meta } from '@storybook/react'
import { useEffect, useState } from 'react'
import type { ProcessStatus } from './ProcessIndicator'
import { ProcessIndicator } from './ProcessIndicator'

/**
 * A component that animates the progress indicator
 */
const AnimatedProcessIndicator = ({
  initialProgress = 0,
  incrementSpeed = 300,
  incrementAmount = 5,
  title = 'Processing data...',
  subtitle = 'Please wait while the operation completes',
  primaryActionLabel,
  secondaryActionLabel,
  initialExpanded = true,
}: {
  initialProgress?: number
  incrementSpeed?: number
  incrementAmount?: number
  title?: string
  subtitle?: string
  primaryActionLabel?: string
  secondaryActionLabel?: string
  initialExpanded?: boolean
}) => {
  const [progress, setProgress] = useState(initialProgress)
  const [status, setStatus] = useState<ProcessStatus>('processing')

  useEffect(() => {
    // Reset animation when component mounts
    setProgress(initialProgress)
    setStatus('processing')

    const interval = setInterval(() => {
      setProgress((currentProgress) => {
        // If we're already at 100%, don't increment further
        if (currentProgress >= 100) {
          clearInterval(interval)
          // Set a small delay before changing status to complete
          setTimeout(() => {
            setStatus('complete')
          }, 500)
          return 100
        }

        // Calculate next progress value
        const nextProgress = currentProgress + incrementAmount
        // If next progress would exceed 100, cap at 100
        return nextProgress > 100 ? 100 : nextProgress
      })
    }, incrementSpeed)

    // Clean up interval on unmount
    return () => clearInterval(interval)
  }, [initialProgress, incrementSpeed, incrementAmount])

  return (
    <ProcessIndicator
      status={status}
      title={
        status === 'complete' ? `${title.replace('...', '')} Complete` : title
      }
      subtitle={
        status === 'complete' ? 'Operation completed successfully' : subtitle
      }
      progress={progress}
      primaryActionLabel={primaryActionLabel}
      secondaryActionLabel={secondaryActionLabel}
      initialExpanded={initialExpanded}
    />
  )
}

// Define the props type for our animated component
type AnimatedProcessIndicatorProps = {
  initialProgress?: number
  incrementSpeed?: number
  incrementAmount?: number
  title?: string
  subtitle?: string
  primaryActionLabel?: string
  secondaryActionLabel?: string
  initialExpanded?: boolean
}

// Create a meta object for our animated stories
const meta: Meta<AnimatedProcessIndicatorProps> = {
  title: 'Components/Chat/ProcessIndicator/Animation',
  component: AnimatedProcessIndicator,
  parameters: {
    layout: 'centered',
  },
}

export default meta

// Standard progress animation
export const StandardAnimation = () => (
  <AnimatedProcessIndicator
    initialProgress={0}
    incrementSpeed={300}
    incrementAmount={5}
    title="Building application..."
    subtitle="Please wait while we compile your application"
    primaryActionLabel="View Build"
    secondaryActionLabel="Cancel"
  />
)

StandardAnimation.storyName = 'Standard Progress Animation'

// Fast progress animation
export const FastAnimation = () => (
  <AnimatedProcessIndicator
    initialProgress={30}
    incrementSpeed={150}
    incrementAmount={7}
    title="Optimizing database..."
    subtitle="Performing database optimization"
    primaryActionLabel="View Details"
  />
)

FastAnimation.storyName = 'Fast Progress Animation'

// Slow progress animation
export const SlowAnimation = () => (
  <AnimatedProcessIndicator
    initialProgress={10}
    incrementSpeed={500}
    incrementAmount={3}
    title="Running tests..."
    subtitle="Executing test suite"
    primaryActionLabel="View Tests"
    secondaryActionLabel="Cancel"
  />
)

SlowAnimation.storyName = 'Slow Progress Animation'
