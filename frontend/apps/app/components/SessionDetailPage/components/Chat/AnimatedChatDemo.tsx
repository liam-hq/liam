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
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleMessageSend = (_entry: TimelineItemEntry) => {}

  const handleStart = () => {
    if (currentIndex === 0 || currentIndex >= ITEMS.length) {
      setCurrentIndex(0)
    }
    setIsAnimating(true)
  }

  const handlePause = () => {
    setIsAnimating(false)
  }

  const handleReset = () => {
    setIsAnimating(false)
    setCurrentIndex(0)
  }

  useEffect(() => {
    if (!isAnimating || currentIndex >= ITEMS.length) {
      if (currentIndex >= ITEMS.length) {
        setIsAnimating(false)
      }
      return
    }

    const timer = setTimeout(() => {
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
      <Chat {...props} onMessageSend={handleMessageSend} />
    </>
  )
}
