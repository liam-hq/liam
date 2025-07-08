import type { Meta, StoryObj } from '@storybook/react'
import { useEffect, useState } from 'react'
import type { ProcessStatus } from './ProcessIndicator'
import { ProcessIndicator } from './ProcessIndicator'

type Props = {
  initialProgress?: number
  incrementSpeed?: number
  incrementAmount?: number
  title?: string
  subtitle?: string
  primaryActionLabel?: string
  secondaryActionLabel?: string
  initialExpanded?: boolean
}

const AnimatedProcessIndicator = ({
  initialProgress = 0,
  incrementSpeed = 300,
  incrementAmount = 5,
  title = 'Processing data...',
  subtitle = 'Please wait while the operation completes',
  primaryActionLabel,
  secondaryActionLabel,
  initialExpanded = true,
}: Props) => {
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

const meta = {
  component: AnimatedProcessIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  render: (args) => <AnimatedProcessIndicator {...args} />,
} satisfies Meta<typeof AnimatedProcessIndicator>

export default meta
type Story = StoryObj<typeof meta>

// Standard progress animation
export const StandardAnimation: Story = {
  args: {
    initialProgress: 0,
    incrementSpeed: 300,
    incrementAmount: 5,
    title: 'Building application...',
    subtitle: 'Please wait while we compile your application',
    primaryActionLabel: 'View Build',
    secondaryActionLabel: 'Cancel',
  },
  name: 'Standard Progress Animation',
}

// Fast progress animation
export const FastAnimation: Story = {
  args: {
    initialProgress: 30,
    incrementSpeed: 150,
    incrementAmount: 7,
    title: 'Optimizing database...',
    subtitle: 'Performing database optimization',
    primaryActionLabel: 'View Details',
  },
  name: 'Fast Progress Animation',
}

// Slow progress animation
export const SlowAnimation: Story = {
  args: {
    initialProgress: 10,
    incrementSpeed: 500,
    incrementAmount: 3,
    title: 'Running tests...',
    subtitle: 'Executing test suite',
    primaryActionLabel: 'View Tests',
    secondaryActionLabel: 'Cancel',
  },
  name: 'Slow Progress Animation',
}
