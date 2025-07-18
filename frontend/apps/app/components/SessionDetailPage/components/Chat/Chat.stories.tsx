import { aBuildingSchemaVersion } from '@liam-hq/db'
import { aSchema } from '@liam-hq/db-structure'
import { Button } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/react'
import { HttpResponse, http } from 'msw'
import { type ComponentProps, useEffect, useState } from 'react'
import { aTypicalConversation } from '../../factories'
import type { TimelineItemEntry } from '../../types'
import { Chat } from './Chat'

const ITEMS = aTypicalConversation()

const meta = {
  component: Chat,
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [
        http.get(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/building_schema_versions`,
          () => {
            return HttpResponse.json({
              ...aBuildingSchemaVersion(),
            })
          },
        ),
      ],
    },
  },
  args: {
    schemaData: aSchema(),
    designSessionId: 'design-session-id',
  },
} satisfies Meta<typeof Chat>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    schemaData: aSchema(),
    designSessionId: 'design-session-id',
    timelineItems: ITEMS,
    onMessageSend: () => {},
  },
}

const AnimatedChatDemo = (props: ComponentProps<typeof Chat>) => {
  const [timelineItems, setTimelineItems] = useState<TimelineItemEntry[]>(
    props.timelineItems,
  )
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
      setTimelineItems((prev) => [...prev, ITEMS[currentIndex]])
      setCurrentIndex((prev) => prev + 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [isAnimating, currentIndex])

  return (
    <>
      <div style={{ display: 'flex', gap: 'var(--spacing-2half)' }}>
        <Button
          type="button"
          disabled={isAnimating}
          variant="outline-secondary"
          size="sm"
          onClick={handleStart}
        >
          Start
        </Button>
        <Button
          type="button"
          disabled={!isAnimating}
          variant="outline-secondary"
          size="sm"
          onClick={handlePause}
        >
          Pause
        </Button>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={handleReset}
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

export const AnimatedDemo: Story = {
  args: {
    schemaData: aSchema(),
    designSessionId: 'design-session-id',
    timelineItems: ITEMS,
    onMessageSend: () => {},
  },
  render: (props) => <AnimatedChatDemo {...props} />,
}
