import { Button } from '@liam-hq/ui'
import { type ComponentProps, useEffect, useState } from 'react'
import { aTypicalConversation } from '../../factories'
import type { TimelineItemEntry } from '../../types'
import { Chat } from './Chat'

const ITEMS = aTypicalConversation()

type AnimatedChatDemoProps = ComponentProps<typeof Chat> & {
  animationInterval?: number
}

export const AnimatedChatDemo = ({
  animationInterval = 1000,
  ...props
}: AnimatedChatDemoProps) => {
  const [timelineItems, setTimelineItems] = useState<TimelineItemEntry[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleMessageSend = (entry: TimelineItemEntry) => {
    setTimelineItems((prev) => [...prev, entry])
  }

  const handleStart = () => {
    if (currentIndex === 0 || currentIndex >= ITEMS.length) {
      setCurrentIndex(0)
      setTimelineItems([])
    }
    setIsAnimating(true)
  }

  const handlePause = () => {
    setIsAnimating(false)
  }

  const handleReset = () => {
    setIsAnimating(false)
    setCurrentIndex(0)
    setTimelineItems([])
  }

  useEffect(() => {
    if (!isAnimating || currentIndex >= ITEMS.length) {
      if (currentIndex >= ITEMS.length) {
        setIsAnimating(false)
      }
      return
    }

    const timer = setTimeout(() => {
      const nextItem = ITEMS[currentIndex]
      if (nextItem) {
        setTimelineItems((prev) => [...prev, nextItem])
      }
      setCurrentIndex((prev) => prev + 1)
    }, animationInterval)

    return () => clearTimeout(timer)
  }, [isAnimating, currentIndex, animationInterval])

  return (
    <>
      <div style={{ display: 'flex', gap: 'var(--spacing-2half)' }}>
        <Button
          type="button"
          disabled={isAnimating}
          variant="outline-secondary"
          size="sm"
          onClick={handleStart}
          aria-label="Start animation"
        >
          Start
        </Button>
        <Button
          type="button"
          disabled={!isAnimating}
          variant="outline-secondary"
          size="sm"
          onClick={handlePause}
          aria-label="Pause animation"
        >
          Pause
        </Button>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={handleReset}
          aria-label="Reset animation"
        >
          Reset
        </Button>
      </div>
      <Chat
        {...props}
        timelineItems={timelineItems}
        onMessageSend={handleMessageSend}
      />
    </>
  )
}
