'use client'

import type { Schema } from '@liam-hq/db-structure'
import { type FC, useTransition } from 'react'
import type { TimelineItemEntry } from '../../types'
import styles from './Chat.module.css'
import { ChatInput } from './components/ChatInput'
import { TimelineItem } from './components/TimelineItem'
import { sendChatMessage } from './services'
import { generateTimelineItemId } from './services/timelineItemHelpers'
import { useScrollToBottom } from './useScrollToBottom'

type Props = {
  schemaData: Schema
  designSessionId: string
  timelineItems: TimelineItemEntry[]
  onMessageSend: (entry: TimelineItemEntry) => void
  onRetry?: () => void
}

export const Chat: FC<Props> = ({
  schemaData,
  designSessionId,
  timelineItems,
  onMessageSend,
  onRetry,
}) => {
  const [isLoading, startTransition] = useTransition()
  const { containerRef, scrollToBottom } = useScrollToBottom<HTMLDivElement>(
    timelineItems.length,
  )

  // Start AI response without saving user message (for auto-start scenarios)
  const startAIResponse = async (content: string) => {
    // Send chat message to API
    const result = await sendChatMessage({
      userInput: content,
      designSessionId,
    })

    if (result.success) {
      scrollToBottom()
    }
  }

  // TODO: Add rate limiting - Implement rate limiting for message sending to prevent spam
  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: TimelineItemEntry = {
      id: generateTimelineItemId('user'),
      content,
      type: 'user',
      timestamp: new Date(),
    }
    onMessageSend(userMessage)

    startTransition(() => {
      startAIResponse(content)
    })
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.messagesContainer} ref={containerRef}>
        {/* Display all timeline items */}
        {timelineItems.map((timelineItem) => (
          <TimelineItem
            key={timelineItem.id}
            {...timelineItem}
            {...(timelineItem.type === 'error' && { onRetry })}
          />
        ))}
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
          </div>
        )}
      </div>
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        schema={schemaData}
      />
    </div>
  )
}
